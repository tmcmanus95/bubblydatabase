// Read-only data-integrity checks (P1-12). Every check is a query or aggregation; nothing is written.
// Used by scripts/integrityReport.js; findings feed the dedupe + index migration (P1-13).

const ids = (docs) => docs.map((d) => String(d._id));

// Values in `field` (an array of ids on each doc in `from`) that don't exist in collection `to`
const danglingRefs = (db, from, field, to) =>
  db
    .collection(from)
    .aggregate([
      { $project: { ref: `$${field}` } },
      { $unwind: "$ref" },
      { $lookup: { from: to, localField: "ref", foreignField: "_id", as: "hit" } },
      { $match: { hit: { $size: 0 } } },
      { $group: { _id: "$_id", missing: { $push: "$ref" } } },
    ])
    .toArray();

// Docs in `from` whose single ref `field` points nowhere in `to`
const orphans = (db, from, field, to) =>
  db
    .collection(from)
    .aggregate([
      { $match: { [field]: { $ne: null } } },
      { $lookup: { from: to, localField: field, foreignField: "_id", as: "hit" } },
      { $match: { hit: { $size: 0 } } },
      { $project: { _id: 1 } },
    ])
    .toArray();

// Ratings missing from the arrays that should list them (product.ratings / user.ratings)
const missingBackRefs = (db, ownerField, ownerCollection, arrayField) =>
  db
    .collection("ratings")
    .aggregate([
      { $lookup: { from: ownerCollection, localField: ownerField, foreignField: "_id", as: "owner" } },
      { $unwind: "$owner" },
      { $match: { $expr: { $not: { $in: ["$_id", { $ifNull: [`$owner.${arrayField}`, []] }] } } } },
      { $project: { _id: 1 } },
    ])
    .toArray();

const integrityReport = async (db) => {
  const counts = {};
  for (const name of ["users", "bubblywaters", "ratings", "reviews"]) counts[name] = await db.collection(name).countDocuments();

  const duplicateGroups = await db
    .collection("ratings")
    .aggregate([
      { $match: { user: { $ne: null } } }, // anonymous ratings are counted separately
      { $group: { _id: { user: "$user", bubblyWater: "$bubblyWater" }, n: { $sum: 1 }, ids: { $push: "$_id" } } },
      { $match: { n: { $gt: 1 } } },
      { $sort: { n: -1 } },
    ])
    .toArray();

  const invalidRatings = await db
    .collection("ratings")
    .find({
      $or: [
        { rating: { $not: { $type: "number" } } },
        { rating: { $lt: 0.5 } },
        { rating: { $gt: 5 } },
        { $expr: { $ne: [{ $mod: [{ $multiply: [{ $ifNull: ["$rating", 0] }, 2] }, 1] }, 0] } },
      ],
    })
    .project({ rating: 1 })
    .toArray();

  // Stored averageRating vs the average of the ratings that point at each product
  const drift = await db
    .collection("bubblywaters")
    .aggregate([
      { $lookup: { from: "ratings", localField: "_id", foreignField: "bubblyWater", as: "r" } },
      {
        $project: {
          productName: 1,
          stored: { $ifNull: ["$averageRating", null] },
          actual: { $cond: [{ $gt: [{ $size: "$r" }, 0] }, { $avg: "$r.rating" }, null] },
          count: { $size: "$r" },
        },
      },
      {
        $match: {
          $expr: {
            $or: [
              { $and: [{ $eq: ["$actual", null] }, { $gt: [{ $ifNull: ["$stored", 0] }, 0] }] },
              { $and: [{ $ne: ["$actual", null] }, { $gt: [{ $abs: { $subtract: [{ $ifNull: ["$stored", 0] }, "$actual"] } }, 0.01] }] },
            ],
          },
        },
      },
      { $sort: { count: -1 } },
    ])
    .toArray();

  // Ratings with no user at all (left from before ratings required a login)
  const anonymousRatings = await db.collection("ratings").countDocuments({ user: null });
  // Ratings whose product AND user are both gone: nothing on the site can show them
  const strandedRatings = await db
    .collection("ratings")
    .aggregate([
      { $lookup: { from: "bubblywaters", localField: "bubblyWater", foreignField: "_id", as: "p" } },
      { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "u" } },
      { $match: { p: { $size: 0 }, u: { $size: 0 }, user: { $ne: null } } },
      { $count: "n" },
    ])
    .toArray();

  // Stored aggregates (P1-14) vs the raw collections; only products that have the fields are checked
  const aggregateDrift = await db
    .collection("bubblywaters")
    .aggregate([
      { $match: { ratingCount: { $exists: true } } },
      { $lookup: { from: "ratings", localField: "_id", foreignField: "bubblyWater", as: "r" } },
      { $lookup: { from: "reviews", localField: "_id", foreignField: "bubblyWater", as: "v" } },
      {
        $project: {
          productName: 1,
          ratingCount: 1,
          reviewCount: 1,
          avgRating: 1,
          averageRating: 1,
          actualRatings: { $size: "$r" },
          actualReviews: { $size: "$v" },
          actualAvg: { $ifNull: [{ $avg: "$r.rating" }, 0] },
        },
      },
      {
        $match: {
          $expr: {
            $or: [
              { $ne: ["$ratingCount", "$actualRatings"] },
              { $ne: ["$reviewCount", "$actualReviews"] },
              { $gt: [{ $abs: { $subtract: [{ $ifNull: ["$avgRating", 0] }, "$actualAvg"] } }, 0.001] },
              { $gt: [{ $abs: { $subtract: [{ $ifNull: ["$avgRating", 0] }, { $ifNull: ["$averageRating", 0] }] } }, 0.001] },
            ],
          },
        },
      },
    ])
    .toArray();

  return {
    counts,
    aggregateDrift: aggregateDrift.map((d) => ({
      _id: String(d._id),
      productName: d.productName,
      stored: { ratingCount: d.ratingCount, reviewCount: d.reviewCount, avgRating: d.avgRating, averageRating: d.averageRating },
      actual: { ratingCount: d.actualRatings, reviewCount: d.actualReviews, avgRating: Math.round(d.actualAvg * 1000) / 1000 },
    })),
    anonymousRatings,
    strandedRatings: strandedRatings.length ? strandedRatings[0].n : 0,
    duplicates: {
      groups: duplicateGroups.length,
      extraRatings: duplicateGroups.reduce((sum, g) => sum + g.n - 1, 0),
      examples: duplicateGroups.slice(0, 20).map((g) => ({ user: String(g._id.user), bubblyWater: String(g._id.bubblyWater), n: g.n })),
    },
    invalidRatings: invalidRatings.map((r) => ({ _id: String(r._id), rating: r.rating })),
    orphans: {
      ratingsWithoutProduct: ids(await orphans(db, "ratings", "bubblyWater", "bubblywaters")),
      ratingsWithoutUser: ids(await orphans(db, "ratings", "user", "users")),
      reviewsWithoutProduct: ids(await orphans(db, "reviews", "bubblyWater", "bubblywaters")),
      reviewsWithoutUser: ids(await orphans(db, "reviews", "user", "users")),
      reviewsWithMissingRating: ids(await orphans(db, "reviews", "rating", "ratings")),
    },
    danglingRefs: {
      productRatings: await danglingRefs(db, "bubblywaters", "ratings", "ratings"),
      productReviews: await danglingRefs(db, "bubblywaters", "reviews", "reviews"),
      userRatings: await danglingRefs(db, "users", "ratings", "ratings"),
      userReviews: await danglingRefs(db, "users", "reviews", "reviews"),
      userLikedReviews: await danglingRefs(db, "users", "likedReviews", "reviews"),
    },
    missingBackRefs: {
      ratingsNotOnProduct: ids(await missingBackRefs(db, "bubblyWater", "bubblywaters", "ratings")),
      ratingsNotOnUser: ids(await missingBackRefs(db, "user", "users", "ratings")),
    },
    averageDrift: drift.map((d) => ({
      _id: String(d._id),
      productName: d.productName,
      stored: d.stored,
      actual: d.actual === null ? null : Math.round(d.actual * 100) / 100,
      ratings: d.count,
    })),
  };
};

const refCount = (list) => list.reduce((sum, d) => sum + d.missing.length, 0);

// A Markdown summary: counts first, then up to 20 examples per finding
const formatReport = (r, { dbName, when = new Date() } = {}) => {
  const lines = [
    `# Data-integrity report`,
    ``,
    `Database: \`${dbName}\` · ${when.toISOString()} · read-only`,
    ``,
    `Collections: ${Object.entries(r.counts).map(([k, v]) => `${k} ${v}`).join(", ")}`,
    ``,
    `| Check | Count |`,
    `|---|---|`,
    `| Duplicate (user, product) rating groups | ${r.duplicates.groups} (${r.duplicates.extraRatings} extra ratings) |`,
    `| Ratings with no user (anonymous, from before login was required) | ${r.anonymousRatings} |`,
    `| Ratings whose product and user are both gone | ${r.strandedRatings} |`,
    `| Ratings with invalid values | ${r.invalidRatings.length} |`,
    `| Ratings whose product is gone | ${r.orphans.ratingsWithoutProduct.length} |`,
    `| Ratings whose user is gone | ${r.orphans.ratingsWithoutUser.length} |`,
    `| Reviews whose product is gone | ${r.orphans.reviewsWithoutProduct.length} |`,
    `| Reviews whose user is gone | ${r.orphans.reviewsWithoutUser.length} |`,
    `| Reviews pointing at a missing rating | ${r.orphans.reviewsWithMissingRating.length} |`,
    `| Product → rating refs that point nowhere | ${refCount(r.danglingRefs.productRatings)} on ${r.danglingRefs.productRatings.length} products |`,
    `| Product → review refs that point nowhere | ${refCount(r.danglingRefs.productReviews)} on ${r.danglingRefs.productReviews.length} products |`,
    `| User → rating refs that point nowhere | ${refCount(r.danglingRefs.userRatings)} on ${r.danglingRefs.userRatings.length} users |`,
    `| User → review refs that point nowhere | ${refCount(r.danglingRefs.userReviews)} on ${r.danglingRefs.userReviews.length} users |`,
    `| User → liked-review refs that point nowhere | ${refCount(r.danglingRefs.userLikedReviews)} on ${r.danglingRefs.userLikedReviews.length} users |`,
    `| Ratings missing from their product's list | ${r.missingBackRefs.ratingsNotOnProduct.length} |`,
    `| Ratings missing from their user's list | ${r.missingBackRefs.ratingsNotOnUser.length} |`,
    `| Products whose stored average is off | ${r.averageDrift.length} |`,
    `| Products whose stored counts/avgRating are off | ${r.aggregateDrift.length} |`,
    ``,
  ];
  if (r.duplicates.examples.length) {
    lines.push(`## Duplicate ratings (up to 20)`, ``, `| user | product | ratings |`, `|---|---|---|`);
    for (const d of r.duplicates.examples) lines.push(`| ${d.user} | ${d.bubblyWater} | ${d.n} |`);
    lines.push(``);
  }
  if (r.averageDrift.length) {
    lines.push(`## Average drift (up to 20)`, ``, `| product | stored | actual | ratings |`, `|---|---|---|---|`);
    for (const d of r.averageDrift.slice(0, 20)) lines.push(`| ${d.productName} (${d._id}) | ${d.stored} | ${d.actual} | ${d.ratings} |`);
    lines.push(``);
  }
  if (r.aggregateDrift.length) {
    lines.push(`## Stored counts/avgRating off (up to 20)`, ``, `| product | stored | actual |`, `|---|---|---|`);
    for (const d of r.aggregateDrift.slice(0, 20)) lines.push(`| ${d.productName} (${d._id}) | ${JSON.stringify(d.stored)} | ${JSON.stringify(d.actual)} |`);
    lines.push(``);
  }
  if (r.invalidRatings.length) {
    lines.push(`## Invalid rating values (up to 20)`, ``);
    for (const d of r.invalidRatings.slice(0, 20)) lines.push(`- ${d._id}: ${JSON.stringify(d.rating)}`);
    lines.push(``);
  }
  return lines.join("\n");
};

module.exports = { integrityReport, formatReport };
