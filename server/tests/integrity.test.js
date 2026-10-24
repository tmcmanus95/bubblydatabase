// P1-12: the read-only integrity checks find each kind of problem, and change nothing.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const { startTestServer } = require("./helpers");
const { integrityReport, formatReport } = require("../scripts/lib/integrity");

let t;
before(async () => {
  t = await startTestServer();
});
after(() => t.stop());
beforeEach(() => t.reset());

const oid = () => new mongoose.Types.ObjectId();

test("each check finds its problem, and the report changes nothing", async () => {
  const db = mongoose.connection.db;
  // Old data predates the one-rating-per-user index (P1-13); drop it to recreate that state
  await db.collection("ratings").dropIndex("user_1_bubblyWater_1").catch(() => {});
  const [u1, u2, gone] = [oid(), oid(), oid()];
  const [p1, p2, p3] = [oid(), oid(), oid()];
  const r = Array.from({ length: 7 }, oid);
  const [rv1, rv2] = [oid(), oid()];

  await db.collection("users").insertMany([
    { _id: u1, username: "a", email: "a@x.test", ratings: [r[0], r[1], r[2], oid()], reviews: [rv1], likedReviews: [oid()] },
    { _id: u2, username: "b", email: "b@x.test", ratings: [], reviews: [] },
  ]);
  await db.collection("bubblywaters").insertMany([
    { _id: p1, productName: "Lime", ratings: [r[0], r[1], r[3]], reviews: [rv1, oid()], averageRating: 4 },
    { _id: p2, productName: "Grapefruit", ratings: [r[2]], reviews: [], averageRating: 3 },
    { _id: p3, productName: "Plain", ratings: [], reviews: [], averageRating: 4.5 },
  ]);
  await db.collection("ratings").insertMany([
    { _id: r[0], user: u1, bubblyWater: p1, rating: 4, createdAt: new Date(1) }, // duplicate pair...
    { _id: r[1], user: u1, bubblyWater: p1, rating: 2, createdAt: new Date(2) }, // ...with this one
    { _id: r[2], user: u1, bubblyWater: p2, rating: 3 },
    { _id: r[3], user: u2, bubblyWater: p1, rating: 4.3 }, // invalid value; also not on u2's list
    { _id: r[4], user: gone, bubblyWater: p2, rating: 5 }, // user is gone; not on p2's list
    { _id: r[5], user: u2, bubblyWater: oid(), rating: 1 }, // product is gone
    { _id: r[6], bubblyWater: p3, rating: 3 }, // anonymous
    { _id: oid(), bubblyWater: p3, rating: 4 }, // anonymous on the same product: not a duplicate
    { _id: oid(), user: gone, bubblyWater: oid(), rating: 2 }, // product and user both gone
  ]);
  await db.collection("reviews").insertMany([
    { _id: rv1, user: u1, bubblyWater: p1, rating: r[0], reviewText: "ok" },
    { _id: rv2, user: gone, bubblyWater: oid(), rating: oid(), reviewText: "orphan" },
  ]);
  const before = await db.collection("ratings").find().toArray();

  const report = await integrityReport(db);
  assert.deepStrictEqual(report.duplicates, {
    groups: 1,
    extraRatings: 1,
    examples: [{ user: String(u1), bubblyWater: String(p1), n: 2 }],
  });
  assert.deepStrictEqual(report.invalidRatings, [{ _id: String(r[3]), rating: 4.3 }]);
  assert.strictEqual(report.orphans.ratingsWithoutProduct.length, 2);
  assert.strictEqual(report.orphans.ratingsWithoutUser.length, 2);
  assert.strictEqual(report.anonymousRatings, 2);
  assert.strictEqual(report.strandedRatings, 1);
  assert.deepStrictEqual(report.orphans.reviewsWithoutProduct, [String(rv2)]);
  assert.deepStrictEqual(report.orphans.reviewsWithoutUser, [String(rv2)]);
  assert.deepStrictEqual(report.orphans.reviewsWithMissingRating, [String(rv2)]);
  assert.strictEqual(report.danglingRefs.productReviews.length, 1);
  assert.strictEqual(report.danglingRefs.userRatings[0].missing.length, 1);
  assert.strictEqual(report.danglingRefs.userLikedReviews.length, 1);
  assert.ok(report.missingBackRefs.ratingsNotOnProduct.includes(String(r[4])));
  assert.ok(report.missingBackRefs.ratingsNotOnUser.includes(String(r[3])));
  const drift = Object.fromEntries(report.averageDrift.map((d) => [d.productName, d]));
  assert.strictEqual(drift.Lime.actual, 3.43); // (4 + 2 + 4.3) / 3, stored 4
  assert.strictEqual(drift.Grapefruit.actual, 4); // (3 + 5) / 2, stored 3
  assert.strictEqual(drift.Plain.actual, 3.5); // two anonymous ratings, stored 4.5

  const text = formatReport(report, { dbName: "test_db", when: new Date(0) });
  assert.match(text, /Duplicate \(user, product\) rating groups \| 1 \(1 extra ratings\)/);
  assert.match(text, /Products whose stored average is off \| 3/);

  assert.deepStrictEqual(await db.collection("ratings").find().toArray(), before, "read-only");
});

test("a clean database reports zero everywhere", async () => {
  const report = await integrityReport(mongoose.connection.db);
  assert.strictEqual(report.duplicates.groups, 0);
  assert.strictEqual(report.averageDrift.length, 0);
  assert.strictEqual(report.invalidRatings.length, 0);
});
