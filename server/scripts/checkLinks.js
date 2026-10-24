// Checks every where-to-buy link and records ok/broken on each offer (P15-6). Logs one JSON line, listing
// broken links.
//
//   npm run check:links -- --dry-run     staging/local from server/.env: report only
//   npm run check:links                  staging/local: record results
//
// Production: only as the weekly Render Cron Job (RUNBOOK), `node server/scripts/checkLinks.js --render-cron`.
// That flag is honored only inside Render (RENDER=true), so it can't be pointed at production from a laptop.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const { assertStaging, parseMongoUri } = require("./lib/assertStaging");
const { checkLinks } = require("./lib/linkCheck");
const { createLogger } = require("../utils/logging");

const logger = createLogger({ name: "check-links" });
const dryRun = process.argv.includes("--dry-run");
const renderCron = process.argv.includes("--render-cron") && process.env.RENDER === "true";
const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bubblywater";
if (!renderCron) assertStaging(uri);

const main = async () => {
  const parsed = parseMongoUri(uri);
  const connection = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 15000 }).asPromise();
  try {
    const result = await checkLinks(connection.db, { dryRun });
    logger[result.broken.length ? "warn" : "info"]({ database: parsed && parsed.dbName, dryRun, ...result }, "link check finished");
  } finally {
    await connection.close();
  }
};

main().catch((error) => {
  logger.error({ err: error }, "link check failed");
  process.exit(1);
});
