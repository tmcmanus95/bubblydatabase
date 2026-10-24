// P1-16: the nightly recompute finds and fixes drift, leaves correct products alone, and the CLI's guard.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const path = require("path");
const { spawnSync } = require("child_process");
const mongoose = require("mongoose");
const { startTestServer } = require("./helpers");
const { recomputeAggregates } = require("../scripts/lib/recompute");
const { integrityReport } = require("../scripts/lib/integrity");

let t;
let db;
before(async () => {
  t = await startTestServer();
  db = mongoose.connection.db;
});
after(() => t.stop());
beforeEach(() => t.reset());

const oid = () => new mongoose.Types.ObjectId();

test("drifted products are fixed in one pass; correct ones are untouched; dry run changes nothing", async () => {
  const [good, bad, empty] = [oid(), oid(), oid()];
  await db.collection("bubblywaters").insertMany([
    { _id: good, productName: "Good", avgRating: 4, ratingCount: 1, reviewCount: 0, averageRating: 4 },
    { _id: bad, productName: "Bad", avgRating: 1, ratingCount: 9, reviewCount: 5, averageRating: 2 },
    { _id: empty, productName: "Empty" }, // no aggregate fields yet
  ]);
  await db.collection("ratings").insertMany([
    { user: oid(), bubblyWater: good, rating: 4 },
    { user: oid(), bubblyWater: bad, rating: 3 },
    { user: oid(), bubblyWater: bad, rating: 5 },
  ]);
  await db.collection("reviews").insertOne({ user: oid(), bubblyWater: bad, reviewText: "ok" });

  const dry = await recomputeAggregates(db, { dryRun: true });
  assert.deepStrictEqual([dry.checked, dry.drifted, dry.fixed], [3, 2, 0]);
  assert.strictEqual((await db.collection("bubblywaters").findOne({ _id: bad })).ratingCount, 9, "dry run wrote nothing");
  assert.deepStrictEqual(dry.drift.find((d) => d.productName === "Bad").fields.ratingCount, { was: 9, now: 2 });

  const goodBefore = await db.collection("bubblywaters").findOne({ _id: good });
  const run = await recomputeAggregates(db);
  assert.deepStrictEqual([run.drifted, run.fixed], [2, 2]);
  const fixed = await db.collection("bubblywaters").findOne({ _id: bad });
  assert.deepStrictEqual([fixed.avgRating, fixed.ratingCount, fixed.reviewCount, fixed.averageRating], [4, 2, 1, 4]);
  const e = await db.collection("bubblywaters").findOne({ _id: empty });
  assert.deepStrictEqual([e.avgRating, e.ratingCount, e.reviewCount], [0, 0, 0]);
  assert.deepStrictEqual(await db.collection("bubblywaters").findOne({ _id: good }), goodBefore);
  assert.strictEqual((await integrityReport(db)).aggregateDrift.length, 0);
  assert.strictEqual((await recomputeAggregates(db)).drifted, 0, "second run finds nothing");
});

const run = (args, env) =>
  spawnSync(process.execPath, [path.join(__dirname, "../scripts/recompute.js"), ...args], {
    env: { ...process.env, MONGODB_URI: "mongodb+srv://user:secret@cluster0.example.net/bubblydatabase3", ...env },
    encoding: "utf8",
    timeout: 20000,
  });

test("the CLI refuses production unless it's the Render cron job", () => {
  for (const [args, env] of [[[], {}], [["--render-cron"], { RENDER: "" }]]) {
    const result = run(args, env);
    assert.strictEqual(result.status, 1, JSON.stringify(args));
    assert.match(result.stderr, /Refusing to run/);
    assert.doesNotMatch(result.stderr + result.stdout, /secret/);
  }
});
