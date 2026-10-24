// P15-6: the weekly link check with a fake network: ok/broken/HEAD-refused/timeouts, Amazon skipped, dry run,
// and the CLI's production guard.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const path = require("path");
const { spawnSync } = require("child_process");
const mongoose = require("mongoose");
const { startTestServer } = require("./helpers");
const { createBubbly } = require("./fixtures");
const { checkLinks } = require("../scripts/lib/linkCheck");

let t;
before(async () => {
  t = await startTestServer();
});
after(() => t.stop());
beforeEach(() => t.reset());

const fakeNet = (routes) => {
  const calls = [];
  const fetchImpl = async (url, { method }) => {
    calls.push(`${method} ${url}`);
    const r = routes[url];
    if (r === "timeout") throw Object.assign(new Error("timed out"), { name: "TimeoutError" });
    if (r === "down") throw new Error("ECONNREFUSED");
    const status = typeof r === "object" ? r[method] : r;
    return { ok: status >= 200 && status < 400, status };
  };
  return { fetchImpl, calls };
};

test("records ok/broken per offer, retries HEAD-refusing shops with GET, skips Amazon", async () => {
  const p = await createBubbly({
    productName: "Lime",
    offers: [
      { retailer: "Good", network: "direct", url: "https://good.example/lime" },
      { retailer: "Gone", network: "direct", url: "https://gone.example/lime" },
      { retailer: "NoHead", network: "direct", url: "https://nohead.example/lime" },
      { retailer: "Slow", network: "direct", url: "https://slow.example/lime" },
      { retailer: "Affiliate", network: "impact", url: "https://shop.example/lime", affiliateUrl: "https://aff.example/x" },
      { retailer: "Amazon", network: "amazon", asin: "B0ABC12345" },
    ],
  });
  const { fetchImpl, calls } = fakeNet({
    "https://good.example/lime": 200,
    "https://gone.example/lime": 404,
    "https://nohead.example/lime": { HEAD: 405, GET: 200 },
    "https://slow.example/lime": "timeout",
    "https://aff.example/x": 200,
  });
  const at = new Date("2026-10-26T09:00:00Z");
  const result = await checkLinks(mongoose.connection.db, { fetchImpl, now: () => at });
  assert.deepStrictEqual([result.offers, result.checked, result.skipped], [6, 5, 1]);
  assert.deepStrictEqual(result.broken.map((b) => [b.retailer, b.status]).sort(), [["Gone", 404], ["Slow", "timeout"]]);
  assert.ok(calls.includes("GET https://nohead.example/lime"), "HEAD refused → GET");
  assert.ok(calls.includes("HEAD https://aff.example/x"), "affiliate URL is what gets checked");
  assert.ok(!calls.some((c) => c.includes("amazon")), "Amazon never visited");

  const offers = Object.fromEntries((await mongoose.connection.db.collection("bubblywaters").findOne({ _id: p._id })).offers.map((o) => [o.retailer, o]));
  assert.strictEqual(offers.Good.status, "ok");
  assert.strictEqual(offers.Gone.status, "broken");
  assert.strictEqual(offers.NoHead.status, "ok");
  assert.strictEqual(offers.Slow.status, "broken");
  assert.strictEqual(offers.Good.lastChecked.toISOString(), at.toISOString());
  assert.strictEqual(offers.Amazon.status, "unknown", "Amazon left as is");
});

test("dry run changes nothing", async () => {
  const p = await createBubbly({ offers: [{ retailer: "Gone", network: "direct", url: "https://gone.example" }] });
  const { fetchImpl } = fakeNet({ "https://gone.example": 404 });
  const result = await checkLinks(mongoose.connection.db, { fetchImpl, dryRun: true });
  assert.strictEqual(result.broken.length, 1);
  assert.strictEqual((await mongoose.connection.db.collection("bubblywaters").findOne({ _id: p._id })).offers[0].status, "unknown");
});

test("the CLI refuses production unless it's the Render cron job", () => {
  const result = spawnSync(process.execPath, [path.join(__dirname, "../scripts/checkLinks.js")], {
    env: { ...process.env, MONGODB_URI: "mongodb+srv://user:secret@cluster0.example.net/bubblydatabase3", RENDER: "" },
    encoding: "utf8",
    timeout: 20000,
  });
  assert.strictEqual(result.status, 1);
  assert.match(result.stderr, /Refusing to run/);
  assert.doesNotMatch(result.stderr + result.stdout, /secret/);
});
