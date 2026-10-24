// P15-1: products get an `offers` list (where to buy: retailer, link, pack size, status), empty to start.
// The products it changes are recorded in migration_undo_202610240005, so down removes the field only
// from those (offers added later by an admin are lost on down, as with any new field).
const UNDO = "migration_undo_202610240005";

module.exports = {
  description: "Add an empty offers list to every product",
  up: async (db) => {
    const products = db.collection("bubblywaters");
    const missing = await products.find({ offers: { $exists: false } }, { projection: { _id: 1 } }).toArray();
    if (!missing.length) return;
    await db.collection(UNDO).insertMany(missing.map((p) => ({ _id: p._id })));
    await products.updateMany({ _id: { $in: missing.map((p) => p._id) } }, { $set: { offers: [] } });
  },
  down: async (db) => {
    const changed = await db.collection(UNDO).find().toArray();
    if (changed.length) await db.collection("bubblywaters").updateMany({ _id: { $in: changed.map((p) => p._id) } }, { $unset: { offers: "" } });
    await db.collection(UNDO).drop().catch(() => {});
  },
};
