// P15-3: the "clicks" collection for where-to-buy redirects: { productId, offerId, network, ts, referrerPath }.
// No personal data: no user, IP or browser details. Down drops the collection.
module.exports = {
  description: "Create clicks collection (where-to-buy redirects, no personal data)",
  up: async (db) => {
    const exists = await db.listCollections({ name: "clicks" }).hasNext();
    if (!exists) await db.createCollection("clicks");
    await db.collection("clicks").createIndex({ productId: 1, ts: -1 }, { name: "productId_1_ts_-1" });
    await db.collection("clicks").createIndex({ ts: -1 }, { name: "ts_-1" });
  },
  down: async (db) => {
    if (await db.listCollections({ name: "clicks" }).hasNext()) await db.collection("clicks").drop();
  },
};
