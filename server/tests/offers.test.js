// P15-1: the offers migration and the offer validation rules.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const { startTestServer } = require("./helpers");
const migration = require("../../migrations/202610240005-add-product-offers");
const { offerInput } = require("../schemas/offerSchema");

let t;
let db;
before(async () => {
  t = await startTestServer();
  db = mongoose.connection.db;
});
after(() => t.stop());
beforeEach(async () => {
  await t.reset();
  await db.collection("migration_undo_202610240005").drop().catch(() => {});
});

test("up gives products an empty offers list; down removes only what it added", async () => {
  const [a, b] = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];
  await db.collection("bubblywaters").insertMany([
    { _id: a, productName: "Old" },
    { _id: b, productName: "Has offers", offers: [{ retailer: "Shop", network: "direct", url: "https://shop.example" }] },
  ]);
  const before = await db.collection("bubblywaters").find().sort({ _id: 1 }).toArray();
  await migration.up(db);
  assert.deepStrictEqual((await db.collection("bubblywaters").findOne({ _id: a })).offers, []);
  assert.strictEqual((await db.collection("bubblywaters").findOne({ _id: b })).offers.length, 1);
  await migration.down(db);
  assert.deepStrictEqual(await db.collection("bubblywaters").find().sort({ _id: 1 }).toArray(), before);
});

test("offer rules: Amazon needs an ASIN, others an https URL; junk is refused", () => {
  const ok = (o) => offerInput.safeParse(o).success;
  assert.ok(ok({ retailer: "Amazon", network: "amazon", asin: "b0abc12345" }));
  assert.strictEqual(offerInput.parse({ retailer: "Amazon", network: "amazon", asin: "b0abc12345" }).asin, "B0ABC12345");
  assert.ok(ok({ retailer: "Target", network: "direct", url: "https://www.target.com/p/123" }));
  assert.ok(!ok({ retailer: "Amazon", network: "amazon" }), "Amazon without ASIN");
  assert.ok(!ok({ retailer: "Target", network: "direct" }), "no URL");
  assert.ok(!ok({ retailer: "Sketchy", network: "direct", url: "http://insecure.example" }), "http");
  assert.ok(!ok({ retailer: "Evil", network: "direct", url: "javascript:alert(1)" }), "javascript:");
  assert.ok(!ok({ retailer: "", network: "direct", url: "https://x.example" }), "no retailer");
  assert.ok(!ok({ retailer: "X", network: "myspace", url: "https://x.example" }), "unknown network");
});
