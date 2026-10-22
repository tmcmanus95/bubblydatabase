// Prints document counts and index names for every collection in a database and, if given expected
// counts, fails when they don't match. Read-only. Staging or local databases only.
//
//   node scripts/verifyCounts.js <mongodb-uri-with-db> ['{"users":45,"bubblywaters":442}']
//
// Exit codes: 0 = ok, 1 = mismatch, empty database or refused URI.
const mongoose = require("mongoose");
const { assertStaging, parseMongoUri } = require("./lib/assertStaging");

const [uri, expectedJson] = process.argv.slice(2);
if (!uri) {
  console.error("usage: node scripts/verifyCounts.js <mongodb-uri-with-db> [expected-counts-json]");
  process.exit(1);
}
assertStaging(uri);

const main = async () => {
  const expected = expectedJson ? JSON.parse(expectedJson) : null;
  const { dbName } = parseMongoUri(uri);
  const connection = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 10000 }).asPromise();
  try {
    const db = connection.db;
    const names = (await db.listCollections({}, { nameOnly: true }).toArray())
      .map((c) => c.name)
      .filter((name) => !name.startsWith("system."))
      .sort();

    const actual = {};
    console.log(`Database "${dbName}"`);
    for (const name of names) {
      const collection = db.collection(name);
      actual[name] = await collection.countDocuments();
      const indexes = (await collection.indexes()).map((index) => index.name);
      console.log(`  ${name.padEnd(20)} ${String(actual[name]).padStart(7)}  indexes: ${indexes.join(", ")}`);
    }

    const problems = [];
    const total = Object.values(actual).reduce((sum, n) => sum + n, 0);
    if (total === 0) {
      problems.push("database is empty");
    }
    if (expected) {
      for (const [name, count] of Object.entries(expected)) {
        if (!(name in actual)) {
          problems.push(`${name}: missing (expected ${count})`);
        } else if (actual[name] !== count) {
          problems.push(`${name}: ${actual[name]} documents, expected ${count}`);
        }
      }
    }

    if (problems.length) {
      console.error(`FAILED:\n  ${problems.join("\n  ")}`);
      process.exitCode = 1;
    } else {
      console.log(expected ? "OK: counts match" : "OK");
    }
  } finally {
    await connection.close();
  }
};

main().catch((err) => {
  console.error(`verifyCounts failed: ${err.message.replace(/\/\/[^@/\s]*@/g, "//<redacted>@")}`);
  process.exit(1);
});
