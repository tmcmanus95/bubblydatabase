// Nightly safety net for the stored product aggregates (P1-16): recomputes avgRating, ratingCount and
// reviewCount (and averageRating, kept equal) from the ratings and reviews collections with $group, and
// fixes only the products that drifted, in one bulkWrite. Returns what it found.
const EPSILON = 1e-9;

const recomputeAggregates = async (db, { dryRun = false } = {}) => {
  const group = async (collection, extra) =>
    new Map(
      (await db.collection(collection).aggregate([{ $group: { _id: "$bubblyWater", n: { $sum: 1 }, ...extra } }]).toArray()).map((g) => [
        String(g._id),
        g,
      ])
    );
  const ratings = await group("ratings", { avg: { $avg: "$rating" } });
  const reviews = await group("reviews");
  const drift = [];
  const ops = [];
  const products = await db
    .collection("bubblywaters")
    .find({}, { projection: { productName: 1, avgRating: 1, ratingCount: 1, reviewCount: 1, averageRating: 1 } })
    .toArray();
  for (const p of products) {
    const r = ratings.get(String(p._id));
    const want = {
      avgRating: r ? r.avg : 0,
      ratingCount: r ? r.n : 0,
      reviewCount: reviews.has(String(p._id)) ? reviews.get(String(p._id)).n : 0,
    };
    want.averageRating = want.avgRating;
    const off = Object.keys(want).filter((k) => typeof p[k] !== "number" || Math.abs(p[k] - want[k]) > EPSILON);
    if (!off.length) continue;
    drift.push({ _id: String(p._id), productName: p.productName, fields: Object.fromEntries(off.map((k) => [k, { was: p[k] ?? null, now: want[k] }])) });
    ops.push({ updateOne: { filter: { _id: p._id }, update: { $set: want } } });
  }
  if (ops.length && !dryRun) await db.collection("bubblywaters").bulkWrite(ops, { ordered: false });
  return { checked: products.length, drifted: drift.length, fixed: dryRun ? 0 : ops.length, drift };
};

module.exports = { recomputeAggregates };
