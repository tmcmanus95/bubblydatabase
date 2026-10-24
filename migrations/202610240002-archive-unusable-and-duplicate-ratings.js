// P1-13 step 1: clean ratings and reviews before the unique (user, product) index.
//
// Moved to ratings_archive / reviews_archive (Thomas's decision, 2026-10-24; DECISIONS.md), each tagged
// with _archive.reason:
//   duplicate     the same user rated the same product more than once: the newest rating stays
//   anonymous     a rating with no user (from before rating required a login)
//   stranded      its product and its user were both deleted
//   product-gone  its product was deleted
//   user-gone     its user was deleted
// Then: reviews that pointed at an archived duplicate point at the kept rating; product and user id lists
// drop ids that no longer exist; every product's averageRating is recomputed from its remaining ratings.
//
// Everything changed is recorded in migration_undo_202610240002, so `down` puts every document and field
// back exactly as it was.
const UNDO = "migration_undo_202610240002";
const TAG = "202610240002";

const key = (id) => (id == null ? "" : String(id));
const time = (doc) => (doc.createdAt ? new Date(doc.createdAt).getTime() : doc._id.getTimestamp().getTime());

module.exports = {
  description: "Archive duplicate, anonymous and orphaned ratings/reviews; repair refs and averages",

  up: async (db) => {
    const undo = db.collection(UNDO);
    if (await undo.estimatedDocumentCount()) throw new Error(`${UNDO} isn't empty: a previous run didn't finish; run down first`);
    const ratings = db.collection("ratings");
    const reviews = db.collection("reviews");
    const products = db.collection("bubblywaters");
    const users = db.collection("users");

    const productIds = new Set((await products.find({}, { projection: { _id: 1 } }).toArray()).map((d) => key(d._id)));
    const userIds = new Set((await users.find({}, { projection: { _id: 1 } }).toArray()).map((d) => key(d._id)));

    // Which ratings go, and why
    const allRatings = await ratings.find().toArray();
    const ratingReason = new Map();
    for (const r of allRatings) {
      const hasProduct = productIds.has(key(r.bubblyWater));
      const hasUser = userIds.has(key(r.user));
      if (r.user == null) ratingReason.set(key(r._id), "anonymous");
      else if (!hasProduct && !hasUser) ratingReason.set(key(r._id), "stranded");
      else if (!hasProduct) ratingReason.set(key(r._id), "product-gone");
      else if (!hasUser) ratingReason.set(key(r._id), "user-gone");
    }
    const keptFor = new Map(); // archived duplicate id -> the rating kept in its place
    const groups = new Map();
    for (const r of allRatings) {
      if (ratingReason.has(key(r._id))) continue;
      const g = `${key(r.user)}|${key(r.bubblyWater)}`;
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(r);
    }
    for (const group of groups.values()) {
      if (group.length < 2) continue;
      group.sort((a, b) => time(b) - time(a) || key(b._id).localeCompare(key(a._id)));
      for (const dup of group.slice(1)) {
        ratingReason.set(key(dup._id), "duplicate");
        keptFor.set(key(dup._id), group[0]._id);
      }
    }

    const allReviews = await reviews.find().toArray();
    const reviewReason = new Map();
    for (const v of allReviews) {
      const hasProduct = productIds.has(key(v.bubblyWater));
      const hasUser = userIds.has(key(v.user));
      if (!hasProduct && !hasUser) reviewReason.set(key(v._id), "stranded");
      else if (!hasProduct) reviewReason.set(key(v._id), "product-gone");
      else if (!hasUser) reviewReason.set(key(v._id), "user-gone");
    }

    const now = new Date();
    const log = [];
    const setField = (collection, doc, field, value) => {
      log.push({ kind: "field", collection, docId: doc._id, field, had: Object.prototype.hasOwnProperty.call(doc, field), value: doc[field] });
      return { updateOne: { filter: { _id: doc._id }, update: { $set: { [field]: value } } } };
    };

    // 1. Move the archived documents
    const archive = async (source, docs, reasons, extra = () => ({})) => {
      const leaving = docs.filter((d) => reasons.has(key(d._id)));
      if (!leaving.length) return;
      await db.collection(`${source}_archive`).insertMany(
        leaving.map((d) => ({ ...d, _archive: { reason: reasons.get(key(d._id)), migration: TAG, archivedAt: now, ...extra(d) } }))
      );
      for (const d of leaving) log.push({ kind: "archived", collection: source, docId: d._id });
      await db.collection(source).deleteMany({ _id: { $in: leaving.map((d) => d._id) } });
    };
    await archive("ratings", allRatings, ratingReason, (d) => (keptFor.has(key(d._id)) ? { keptRating: keptFor.get(key(d._id)) } : {}));
    await archive("reviews", allReviews, reviewReason);

    const liveRatings = allRatings.filter((r) => !ratingReason.has(key(r._id)));
    const liveRatingIds = new Set(liveRatings.map((r) => key(r._id)));
    const liveReviewIds = new Set(allReviews.filter((v) => !reviewReason.has(key(v._id))).map((v) => key(v._id)));

    // 2. Reviews whose rating was an archived duplicate now point at the kept one; any other missing
    //    rating becomes null
    const reviewOps = [];
    for (const v of allReviews) {
      if (reviewReason.has(key(v._id)) || v.rating == null || liveRatingIds.has(key(v.rating))) continue;
      reviewOps.push(setField("reviews", v, "rating", keptFor.get(key(v.rating)) || null));
    }

    // 3. Id lists keep only ids that still exist (also clears refs that were already dangling)
    const prune = (collection, doc, field, live) => {
      const list = Array.isArray(doc[field]) ? doc[field] : null;
      if (!list) return null;
      const kept = list.filter((id) => live.has(key(id)));
      return kept.length === list.length ? null : setField(collection, doc, field, kept);
    };
    const productOps = [];
    const sums = new Map();
    for (const r of liveRatings) {
      const s = sums.get(key(r.bubblyWater)) || { total: 0, n: 0 };
      s.total += Number(r.rating) || 0;
      s.n += 1;
      sums.set(key(r.bubblyWater), s);
    }
    for (const p of await products.find({}, { projection: { ratings: 1, reviews: 1, averageRating: 1 } }).toArray()) {
      for (const field of ["ratings", "reviews"]) {
        const op = prune("bubblywaters", p, field, field === "ratings" ? liveRatingIds : liveReviewIds);
        if (op) productOps.push(op);
      }
      // 4. Average from the ratings that remain
      const s = sums.get(key(p._id));
      const average = s ? s.total / s.n : 0;
      if (p.averageRating !== average) productOps.push(setField("bubblywaters", p, "averageRating", average));
    }
    const userOps = [];
    for (const u of await users.find({}, { projection: { ratings: 1, reviews: 1, likedReviews: 1 } }).toArray()) {
      for (const [field, live] of [["ratings", liveRatingIds], ["reviews", liveReviewIds], ["likedReviews", liveReviewIds]]) {
        const op = prune("users", u, field, live);
        if (op) userOps.push(op);
      }
    }

    // Record first, then change: if a write fails, `down` can still undo what was recorded
    if (log.length) await undo.insertMany(log.map((entry, i) => ({ ...entry, seq: i })));
    if (reviewOps.length) await reviews.bulkWrite(reviewOps);
    if (productOps.length) await products.bulkWrite(productOps);
    if (userOps.length) await users.bulkWrite(userOps);
  },

  down: async (db) => {
    const undo = db.collection(UNDO);
    const entries = await undo.find().sort({ seq: -1 }).toArray();
    for (const e of entries.filter((x) => x.kind === "field")) {
      const update = e.had ? { $set: { [e.field]: e.value } } : { $unset: { [e.field]: "" } };
      await db.collection(e.collection).updateOne({ _id: e.docId }, update);
    }
    for (const source of ["ratings", "reviews"]) {
      const archived = db.collection(`${source}_archive`);
      const docs = await archived.find({ "_archive.migration": TAG }).toArray();
      if (docs.length) {
        await db.collection(source).insertMany(docs.map(({ _archive, ...doc }) => doc));
        await archived.deleteMany({ "_archive.migration": TAG });
      }
      if (!(await archived.estimatedDocumentCount())) await archived.drop().catch(() => {});
    }
    await undo.drop().catch(() => {});
  },
};
