// P1-14: each product stores its own rating average and counts, so pages stop loading every rating just
// to count them. Backfilled from the ratings and reviews collections with $group. `averageRating` (what
// the client reads today) is set to the same value and kept in step until the client switches (P1-23).
// Changed averageRating values are recorded in migration_undo_202610240004; down removes the new fields
// and restores them exactly.
const UNDO = "migration_undo_202610240004";

const groupBy = async (db, collection, extra) =>
  new Map(
    (await db.collection(collection).aggregate([{ $group: { _id: "$bubblyWater", n: { $sum: 1 }, ...extra } }]).toArray()).map((g) => [
      String(g._id),
      g,
    ])
  );

module.exports = {
  description: "Add avgRating, ratingCount and reviewCount to bubblywaters (backfilled)",
  up: async (db) => {
    const products = db.collection("bubblywaters");
    const ratings = await groupBy(db, "ratings", { avg: { $avg: "$rating" } });
    const reviews = await groupBy(db, "reviews");
    const ops = [];
    const undo = [];
    for (const p of await products.find({}, { projection: { averageRating: 1 } }).toArray()) {
      const r = ratings.get(String(p._id));
      const avgRating = r ? r.avg : 0;
      const ratingCount = r ? r.n : 0;
      const reviewCount = reviews.has(String(p._id)) ? reviews.get(String(p._id)).n : 0;
      const set = { avgRating, ratingCount, reviewCount };
      if (p.averageRating !== avgRating) {
        undo.push({ _id: p._id, had: Object.prototype.hasOwnProperty.call(p, "averageRating"), value: p.averageRating });
        set.averageRating = avgRating;
      }
      ops.push({ updateOne: { filter: { _id: p._id }, update: { $set: set } } });
    }
    if (undo.length) await db.collection(UNDO).insertMany(undo);
    if (ops.length) await products.bulkWrite(ops);
  },
  down: async (db) => {
    const products = db.collection("bubblywaters");
    await products.updateMany({}, { $unset: { avgRating: "", ratingCount: "", reviewCount: "" } });
    for (const u of await db.collection(UNDO).find().toArray()) {
      await products.updateOne({ _id: u._id }, u.had ? { $set: { averageRating: u.value } } : { $unset: { averageRating: "" } });
    }
    await db.collection(UNDO).drop().catch(() => {});
  },
};
