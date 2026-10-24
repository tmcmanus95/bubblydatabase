// A minimal migration runner (P1-11). Each file in migrations/ (repo root) is named
// <YYYYMMDDHHMM>-<what-it-does>.js and exports { description, up(db), down(db) }, where db is the native
// MongoDB driver's Db. Applied migrations are recorded in the "migrations_changelog" collection, so
// `up` only runs the new ones, in file-name order, and `down` reverts the most recent one.
const fs = require("fs");
const path = require("path");

const CHANGELOG = "migrations_changelog";
const DEFAULT_DIR = path.join(__dirname, "../../../migrations");
const NAME = /^\d{12}-[a-z0-9-]+\.js$/;

const loadMigrations = (dir = DEFAULT_DIR) =>
  fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".js"))
    .sort()
    .map((file) => {
      if (!NAME.test(file)) throw new Error(`Migration file name must look like 202610231200-add-thing.js: ${file}`);
      const migration = require(path.join(dir, file));
      if (typeof migration.up !== "function" || typeof migration.down !== "function") {
        throw new Error(`${file} must export up(db) and down(db)`);
      }
      return { id: file.replace(/\.js$/, ""), ...migration };
    });

const appliedIds = async (db) =>
  (await db.collection(CHANGELOG).find({}, { sort: { _id: 1 } }).toArray()).map((entry) => entry._id);

// Returns [{ id, description, applied }]
const status = async (db, dir) => {
  const applied = new Set(await appliedIds(db));
  return loadMigrations(dir).map(({ id, description }) => ({ id, description, applied: applied.has(id) }));
};

// Applies every pending migration in order; stops at the first failure. Returns the ids it applied.
const up = async (db, dir, log = console.log) => {
  const applied = new Set(await appliedIds(db));
  const done = [];
  for (const migration of loadMigrations(dir)) {
    if (applied.has(migration.id)) continue;
    log(`up   ${migration.id} — ${migration.description || ""}`);
    await migration.up(db);
    await db.collection(CHANGELOG).insertOne({ _id: migration.id, appliedAt: new Date() });
    done.push(migration.id);
  }
  return done;
};

// Reverts the most recently applied migration. Returns its id, or null if none are applied.
const down = async (db, dir, log = console.log) => {
  const ids = await appliedIds(db);
  if (!ids.length) return null;
  const id = ids[ids.length - 1];
  const migration = loadMigrations(dir).find((m) => m.id === id);
  if (!migration) throw new Error(`${id} is recorded as applied but its file is missing`);
  log(`down ${id} — ${migration.description || ""}`);
  await migration.down(db);
  await db.collection(CHANGELOG).deleteOne({ _id: id });
  return id;
};

module.exports = { CHANGELOG, loadMigrations, status, up, down };
