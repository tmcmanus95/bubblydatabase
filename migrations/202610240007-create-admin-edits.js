// P2-1: the "adminedits" collection: one entry per admin change { admin, action, targetType, targetId,
// before, after, at }. New collection only; down drops it.
module.exports = {
  description: "Create the admin audit log (adminedits)",
  up: async (db) => {
    if (!(await db.listCollections({ name: "adminedits" }).hasNext())) await db.createCollection("adminedits");
    await db.collection("adminedits").createIndex({ targetId: 1, at: -1 }, { name: "targetId_1_at_-1" });
    await db.collection("adminedits").createIndex({ admin: 1, at: -1 }, { name: "admin_1_at_-1" });
  },
  down: async (db) => {
    if (await db.listCollections({ name: "adminedits" }).hasNext()) await db.collection("adminedits").drop();
  },
};
