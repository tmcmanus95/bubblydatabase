// P15-3: /go/:productId/:offerId redirects to active offers only, builds Amazon links from the ASIN and tag,
// and logs anonymous clicks.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const { startTestServer } = require("./helpers");
const { createBubbly } = require("./fixtures");
const { Click } = require("../models");

let t;
before(async () => {
  t = await startTestServer();
});
after(() => t.stop());
beforeEach(() => t.reset());

const seed = () =>
  createBubbly({
    offers: [
      { retailer: "Amazon", network: "amazon", asin: "B0ABC12345", active: true },
      { retailer: "Target", network: "direct", url: "https://www.target.com/p/1", affiliateUrl: "https://goto.target.com/abc", active: true },
      { retailer: "Gone", network: "direct", url: "https://gone.example", active: false },
      { retailer: "Plain", network: "direct", url: "https://shop.example/lime", active: true },
    ],
  });
const go = (p, o, headers = {}) => t.request.get(`/go/${p._id}/${p.offers[o]._id}`).set(headers).redirects(0);

test("Amazon links come from the ASIN, tagged only when a tag is set", async () => {
  const p = await seed();
  delete process.env.AMAZON_ASSOCIATE_TAG;
  let res = await go(p, 0);
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.location, "https://www.amazon.com/dp/B0ABC12345");
  process.env.AMAZON_ASSOCIATE_TAG = "bubbles-20";
  try {
    res = await go(p, 0);
    assert.strictEqual(res.headers.location, "https://www.amazon.com/dp/B0ABC12345?tag=bubbles-20");
  } finally {
    delete process.env.AMAZON_ASSOCIATE_TAG;
  }
});

test("other offers use the affiliate URL, else the plain URL; inactive or unknown offers 404", async () => {
  const p = await seed();
  assert.strictEqual((await go(p, 1)).headers.location, "https://goto.target.com/abc");
  assert.strictEqual((await go(p, 3)).headers.location, "https://shop.example/lime");
  assert.strictEqual((await go(p, 2)).status, 404, "inactive");
  assert.strictEqual((await t.request.get(`/go/${p._id}/${new mongoose.Types.ObjectId()}`).redirects(0)).status, 404);
  assert.strictEqual((await t.request.get(`/go/not-an-id/also-not`).redirects(0)).status, 404);
});

test("each redirect logs an anonymous click with the same-site page it came from", async () => {
  const p = await seed();
  await go(p, 3, { Host: "bubbles.test", Referer: `https://bubbles.test/bubblyWater/${p._id}?utm=x` });
  await go(p, 3, { Host: "bubbles.test", Referer: "https://elsewhere.example/page" });
  await new Promise((r) => setTimeout(r, 100)); // logging doesn't block the redirect
  const clicks = await Click.find().lean();
  assert.strictEqual(clicks.length, 2);
  for (const c of clicks) {
    assert.deepStrictEqual(Object.keys(c).sort(), ["_id", "network", "offerId", "productId", "ts", ...(c.referrerPath ? ["referrerPath"] : [])].sort());
  }
  assert.deepStrictEqual(clicks.map((c) => c.referrerPath ?? null).sort(), [`/bubblyWater/${p._id}`, null].sort(), "path only, and other sites aren't recorded");
});

test("the redirect asks search engines not to follow it and sends no referrer", async () => {
  const p = await seed();
  const res = await go(p, 3);
  assert.match(res.headers["x-robots-tag"], /noindex/);
  assert.strictEqual(res.headers["referrer-policy"], "no-referrer");
});

test("the clicks migration is reversible", async () => {
  const migration = require("../../migrations/202610240006-create-clicks");
  const db = mongoose.connection.db;
  assert.ok((await db.collection("clicks").indexes()).some((i) => i.name === "productId_1_ts_-1"));
  await migration.down(db);
  assert.strictEqual(await db.listCollections({ name: "clicks" }).hasNext(), false);
  await migration.up(db);
  await migration.up(db);
  assert.strictEqual(await db.listCollections({ name: "clicks" }).hasNext(), true);
});
