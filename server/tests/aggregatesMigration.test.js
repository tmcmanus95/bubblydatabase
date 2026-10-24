// P1-14: product aggregates backfill, the integrity check for them, and an exact down.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const { startTestServer } = require("./helpers");
const migration = require("../../migrations/202610240004-add-product-aggregates");
const { integrityReport } = require("../scripts/lib/integrity");

let t;
let db;
before(async () => {
  t = await startTestServer();
  db = mongoose.connection.db;
});
after(() => t.stop());
beforeEach(async () => {
  await t.reset();
  await db.collection("migration_undo_202610240004").drop().catch(() => {});
});

const oid = () => new mongoose.Types.ObjectId();
const snapshot = async () => db.collection("bubblywaters").find().sort({ _id: 1 }).toArray();

const seed = async () => {
  const [p1, p2, p3] = [oid(), oid(), oid()];
  await db.collection("bubblywaters").insertMany([
    { _id: p1, productName: "Lime", averageRating: 3.5 },
    { _id: p2, productName: "Plain", averageRating: 9 }, // wrong: no ratings
    { _id: p3, productName: "Peach" }, // never had an average
  ]);
  await db.collection("ratings").insertMany([
    { user: oid(), bubblyWater: p1, rating: 3 },
    { user: oid(), bubblyWater: p1, rating: 4 },
  ]);
  await db.collection("reviews").insertMany([{ user: oid(), bubblyWater: p1, reviewText: "ok" }]);
  return { p1, p2, p3 };
};

test("up backfills avgRating, ratingCount, reviewCount and keeps averageRating equal", async () => {
  const { p1, p2, p3 } = await seed();
  await migration.up(db);
  const get = (id) => db.collection("bubblywaters").findOne({ _id: id });
  const lime = await get(p1);
  assert.deepStrictEqual([lime.avgRating, lime.ratingCount, lime.reviewCount, lime.averageRating], [3.5, 2, 1, 3.5]);
  const plain = await get(p2);
  assert.deepStrictEqual([plain.avgRating, plain.ratingCount, plain.reviewCount, plain.averageRating], [0, 0, 0, 0]);
  assert.strictEqual((await get(p3)).ratingCount, 0);
  assert.strictEqual((await integrityReport(db)).aggregateDrift.length, 0, "totals match the raw collections");

  // A new rating that skips the aggregates shows up as drift
  await db.collection("ratings").insertOne({ user: oid(), bubblyWater: p1, rating: 5 });
  const drift = (await integrityReport(db)).aggregateDrift;
  assert.strictEqual(drift.length, 1);
  assert.deepStrictEqual(drift[0].actual, { ratingCount: 3, reviewCount: 1, avgRating: 4 });
});

test("down removes the new fields and restores averageRating exactly", async () => {
  await seed();
  const before = await snapshot();
  await migration.up(db);
  await migration.down(db);
  assert.deepStrictEqual(await snapshot(), before);
});
