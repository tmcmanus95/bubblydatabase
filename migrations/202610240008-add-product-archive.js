// P2-2: products can be archived (archivedAt set). No data changes: a missing archivedAt means "not archived"
// (queries filter on archivedAt: null, which matches missing too). This adds the index for that filter; down
// drops it. Archived products' ratings and reviews are kept.
module.exports = {
  description: "Index products' archivedAt (archiving, P2-2)",
  up: async (db) => {
    await db.collection("bubblywaters").createIndex({ archivedAt: 1 }, { name: "archivedAt_1" });
  },
  down: async (db) => {
    const exists = (await db.collection("bubblywaters").indexes()).some((i) => i.name === "archivedAt_1");
    if (exists) await db.collection("bubblywaters").dropIndex("archivedAt_1");
  },
};
