// P1-18: per-account rating limits (stricter for new accounts) and the trustedForAggregates rule.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const { startTestServer } = require("./helpers");
const { createUser, createBubbly } = require("./fixtures");
const { createRatingLimiter, trustedForAggregates, RATING_RULES } = require("../utils/ratingRules");

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const idFrom = (msAgo) => mongoose.Types.ObjectId.createFromTime(Math.floor((Date.now() - msAgo) / 1000));
const codeOf = (fn) => {
  try {
    fn();
    return null;
  } catch (e) {
    return e.extensions.code;
  }
};

test("established accounts get the normal hourly limit, new accounts a stricter one, and the window slides", () => {
  let now = Date.now();
  const limiter = createRatingLimiter({ ...RATING_RULES, maxPerWindow: 5, newAccountMaxPerWindow: 2 }, () => now);
  const old = idFrom(30 * DAY);
  const fresh = idFrom(HOUR);
  for (let i = 0; i < 5; i++) assert.strictEqual(codeOf(() => limiter.check(old)), null);
  assert.strictEqual(codeOf(() => limiter.check(old)), "RATE_LIMITED");
  for (let i = 0; i < 2; i++) assert.strictEqual(codeOf(() => limiter.check(fresh)), null);
  assert.strictEqual(codeOf(() => limiter.check(fresh)), "RATE_LIMITED");
  now += HOUR + 1;
  assert.strictEqual(codeOf(() => limiter.check(old)), null, "an hour later the limit has reset");
});

test("trustedForAggregates: verified, or unverified but at least 7 days old", () => {
  assert.strictEqual(trustedForAggregates({ _id: idFrom(HOUR), isVerified: true }), true);
  assert.strictEqual(trustedForAggregates({ _id: idFrom(HOUR), isVerified: false }), false);
  assert.strictEqual(trustedForAggregates({ _id: idFrom(8 * DAY), isVerified: false }), true);
  assert.strictEqual(trustedForAggregates(null), false);
});

let t;
before(async () => {
  t = await startTestServer();
});
after(() => t.stop());
beforeEach(() => t.reset());

test("addRating enforces the new-account limit with a friendly message", async () => {
  const fresh = await createUser(); // just created: a new account
  const waters = await Promise.all(Array.from({ length: RATING_RULES.newAccountMaxPerWindow + 1 }, (_, i) => createBubbly({ productName: `W${i}` })));
  const RATE = `mutation($b: ID!) { addRating(bubblyWaterId: $b, rating: 4) { _id } }`;
  for (const w of waters.slice(0, -1)) assert.ifError((await t.gql(RATE, { b: String(w._id) }, fresh)).errors);
  const blocked = await t.gql(RATE, { b: String(waters.at(-1)._id) }, fresh);
  assert.strictEqual(blocked.errors[0].extensions.code, "RATE_LIMITED");
  assert.match(blocked.errors[0].message, /rating very fast/);
});
