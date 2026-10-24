// P1-6: the "sessions" collection for cookie sessions (models/Session.js). New collection only; no
// existing data is touched. Down drops it, which signs every browser out of cookie sessions (they log
// in again normally; passwords are unaffected).
module.exports = {
  description: "Create sessions collection with token, user and expiry (TTL) indexes",
  up: async (db) => {
    const exists = await db.listCollections({ name: "sessions" }).hasNext();
    if (!exists) await db.createCollection("sessions");
    const sessions = db.collection("sessions");
    await sessions.createIndex({ tokenHash: 1 }, { name: "tokenHash_1", unique: true });
    await sessions.createIndex({ user: 1 }, { name: "user_1" });
    // MongoDB deletes each session shortly after it expires
    await sessions.createIndex({ expiresAt: 1 }, { name: "expiresAt_ttl", expireAfterSeconds: 0 });
  },
  down: async (db) => {
    const exists = await db.listCollections({ name: "sessions" }).hasNext();
    if (exists) await db.collection("sessions").drop();
  },
};
