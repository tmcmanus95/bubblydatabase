// P1-7: every existing account gets role "user". Admins are then set one by one with
// `node server/scripts/setRole.js <username> admin` (CLAUDE.md rule 5: server-side role checks).
// The accounts it changes are recorded in migration_undo_202610240001, so down removes the role only from
// those, leaving accounts that already had one (e.g. created after the roles code shipped) untouched.
const UNDO = "migration_undo_202610240001";

module.exports = {
  description: 'Add role "user" to every account that has no role',
  up: async (db) => {
    const users = db.collection("users");
    const missing = await users.find({ role: { $exists: false } }, { projection: { _id: 1 } }).toArray();
    if (!missing.length) return;
    await db.collection(UNDO).insertMany(missing.map((u) => ({ _id: u._id })));
    await users.updateMany({ _id: { $in: missing.map((u) => u._id) } }, { $set: { role: "user" } });
  },
  down: async (db) => {
    const changed = await db.collection(UNDO).find().toArray();
    if (changed.length) await db.collection("users").updateMany({ _id: { $in: changed.map((u) => u._id) } }, { $unset: { role: "" } });
    await db.collection(UNDO).drop().catch(() => {});
  },
};
