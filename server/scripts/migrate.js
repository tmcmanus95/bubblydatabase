// Runs database migrations from migrations/ (see scripts/lib/migrations.js).
//
//   npm run migrate:status | migrate:up | migrate:down        (from the repo root)
//
// Uses MONGODB_URI from server/.env and refuses anything but the staging or a local database. Production
// migrations are run by Thomas only, who adds --i-am-thomas-on-prod (CLAUDE.md rule 1).
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const { assertStaging, parseMongoUri } = require("./lib/assertStaging");
const migrations = require("./lib/migrations");

const command = process.argv[2];
const onProd = process.argv.includes("--i-am-thomas-on-prod");
const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bubblywater";

if (!["status", "up", "down"].includes(command)) {
  console.error("usage: node scripts/migrate.js status|up|down [--i-am-thomas-on-prod]");
  process.exit(1);
}
if (!onProd) assertStaging(uri);

const main = async () => {
  const parsed = parseMongoUri(uri);
  console.log(`Database: ${parsed ? parsed.dbName : "(unknown)"}${onProd ? "  (production override)" : ""}`);
  const connection = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 10000 }).asPromise();
  try {
    const db = connection.db;
    if (command === "status") {
      for (const m of await migrations.status(db)) console.log(`${m.applied ? "[x]" : "[ ]"} ${m.id} — ${m.description || ""}`);
    } else if (command === "up") {
      const done = await migrations.up(db);
      console.log(done.length ? `Applied ${done.length} migration(s).` : "Nothing to apply.");
    } else {
      const id = await migrations.down(db);
      console.log(id ? `Reverted ${id}.` : "Nothing to revert.");
    }
  } finally {
    await connection.close();
  }
};

main().catch((error) => {
  console.error(`Migration failed: ${error.message}`);
  process.exit(1);
});
