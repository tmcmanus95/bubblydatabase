// Prints (and saves) a data-integrity report for the staging or a local database. Read-only.
//
//   npm run report:integrity            (repo root; uses server/.env)
//
// Saved to reports/integrity-<database>-<date>.md, which is gitignored: the repo is public and the report
// lists user and product ids.
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const { assertStaging, parseMongoUri } = require("./lib/assertStaging");
const { integrityReport, formatReport } = require("./lib/integrity");

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bubblywater";
assertStaging(uri);

const main = async () => {
  const { dbName } = parseMongoUri(uri);
  const connection = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 10000, readPreference: "secondaryPreferred" }).asPromise();
  try {
    const report = formatReport(await integrityReport(connection.db), { dbName });
    const dir = path.join(__dirname, "../../reports");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `integrity-${dbName}-${new Date().toISOString().slice(0, 10)}.md`);
    fs.writeFileSync(file, report);
    console.log(report);
    console.log(`\nSaved to ${path.relative(process.cwd(), file)}`);
  } finally {
    await connection.close();
  }
};

main().catch((error) => {
  console.error(`Report failed: ${error.message}`);
  process.exit(1);
});
