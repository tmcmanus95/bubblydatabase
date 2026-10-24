// P1-7: every existing account gets role "user". Admins are then set one by one with
// `node server/scripts/setRole.js <email> admin` (CLAUDE.md rule 5: server-side role checks).
// Down removes the field from every user, admins included, restoring the documents exactly as before.
module.exports = {
  description: 'Add role "user" to every account that has no role',
  up: async (db) => {
    await db.collection("users").updateMany({ role: { $exists: false } }, { $set: { role: "user" } });
  },
  down: async (db) => {
    await db.collection("users").updateMany({ role: { $exists: true } }, { $unset: { role: "" } });
  },
};
