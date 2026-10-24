// Recomputes every product's stored aggregates and fixes drift (P1-16). Logs one JSON line with the result.
//
//   npm run recompute -- --dry-run      staging/local from server/.env: report drift, change nothing
//   npm run recompute                   staging/local: fix drift
//
// Production: only as the nightly Render Cron Job (Thomas creates it; RUNBOOK), which shares the web
// service's environment and runs `node server/scripts/recompute.js --render-cron`. That flag is honored
// only inside Render (the RENDER env var), so it can't be pointed at production from a laptop.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const { assertStaging, parseMongoUri } = require("./lib/assertStaging");
const { recomputeAggregates } = require("./lib/recompute");
const { createLogger } = require("../utils/logging");

const logger = createLogger({ name: "recompute" });
const dryRun = process.argv.includes("--dry-run");
const renderCron = process.argv.includes("--render-cron") && process.env.RENDER === "true";
const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bubblywater";
if (!renderCron) assertStaging(uri);

const main = async () => {
  const parsed = parseMongoUri(uri);
  const connection = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 15000 }).asPromise();
  try {
    const result = await recomputeAggregates(connection.db, { dryRun });
    const summary = { database: parsed && parsed.dbName, dryRun, checked: result.checked, drifted: result.drifted, fixed: result.fixed };
    // Up to 20 examples, so a big drift is visible without flooding the log
    logger[result.drifted ? "warn" : "info"]({ ...summary, examples: result.drift.slice(0, 20) }, "aggregate recompute finished");
  } finally {
    await connection.close();
  }
};

main().catch((error) => {
  logger.error({ err: error }, "aggregate recompute failed");
  process.exit(1);
});
