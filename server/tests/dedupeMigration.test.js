// P1-13: archiving unusable/duplicate ratings, then the indexes. Down must restore everything exactly.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const { startTestServer } = require("./helpers");
const clean = require("../../migrations/202610240002-archive-unusable-and-duplicate-ratings");
const indexes = require("../../migrations/202610240003-add-rating-review-product-indexes");

let t;
let db;
before(async () => {
  t = await startTestServer();
  db = mongoose.connection.db;
});
after(() => t.stop());
beforeEach(async () => {
  await t.reset();
  await indexes.down(db); // recreate the pre-migration state
  for (const c of ["ratings_archive", "reviews_archive", "migration_undo_202610240002"]) await db.collection(c).drop().catch(() => {});
});

const oid = () => new mongoose.Types.ObjectId();
const snapshot = async () => {
  const out = {};
  for (const c of ["users", "bubblywaters", "ratings", "reviews"]) out[c] = await db.collection(c).find().sort({ _id: 1 }).toArray();
  return out;
};

const seed = async () => {
  const [u1, u2, goneUser] = [oid(), oid(), oid()];
  const [p1, p2] = [oid(), oid()];
  const ids = {
    old: oid(), newer: oid(), other: oid(), anon: oid(), stranded: oid(), productGone: oid(), userGone: oid(),
    review: oid(), strandedReview: oid(), danglingRating: oid(),
  };
  await db.collection("users").insertMany([
    { _id: u1, username: "a", email: "a@x.test", ratings: [ids.old, ids.newer, ids.other, ids.productGone, ids.danglingRating], reviews: [ids.review], likedReviews: [ids.strandedReview] },
    { _id: u2, username: "b", email: "b@x.test", ratings: [], reviews: [] },
  ]);
  await db.collection("bubblywaters").insertMany([
    { _id: p1, productName: "Lime", ratings: [ids.old, ids.newer, ids.anon, ids.userGone], reviews: [ids.review], averageRating: 3.25 },
    { _id: p2, productName: "Plain", ratings: [ids.other], reviews: [], averageRating: 2 },
  ]);
  await db.collection("ratings").insertMany([
    { _id: ids.old, user: u1, bubblyWater: p1, rating: 2, createdAt: new Date("2024-01-01") },
    { _id: ids.newer, user: u1, bubblyWater: p1, rating: 4.5, createdAt: new Date("2024-06-01") },
    { _id: ids.other, user: u1, bubblyWater: p2, rating: 3 },
    { _id: ids.anon, bubblyWater: p1, rating: 1 },
    { _id: ids.stranded, user: goneUser, bubblyWater: oid(), rating: 5 },
    { _id: ids.productGone, user: u1, bubblyWater: oid(), rating: 4 },
    { _id: ids.userGone, user: goneUser, bubblyWater: p1, rating: 5 },
  ]);
  await db.collection("reviews").insertMany([
    { _id: ids.review, user: u1, bubblyWater: p1, rating: ids.old, reviewText: "Crisp" }, // points at the older duplicate
    { _id: ids.strandedReview, user: goneUser, bubblyWater: oid(), rating: ids.stranded, reviewText: "Gone" },
  ]);
  return { u1, p1, p2, ids };
};

test("up archives each kind with its reason, keeps the newest duplicate, and repairs refs and averages", async () => {
  const { u1, p1, p2, ids } = await seed();
  await clean.up(db);

  const archived = Object.fromEntries((await db.collection("ratings_archive").find().toArray()).map((d) => [String(d._id), d._archive]));
  assert.strictEqual(archived[String(ids.old)].reason, "duplicate");
  assert.strictEqual(String(archived[String(ids.old)].keptRating), String(ids.newer));
  assert.strictEqual(archived[String(ids.anon)].reason, "anonymous");
  assert.strictEqual(archived[String(ids.stranded)].reason, "stranded");
  assert.strictEqual(archived[String(ids.productGone)].reason, "product-gone");
  assert.strictEqual(archived[String(ids.userGone)].reason, "user-gone");
  assert.deepStrictEqual((await db.collection("ratings").find().toArray()).map((r) => String(r._id)).sort(), [String(ids.newer), String(ids.other)].sort());
  assert.strictEqual((await db.collection("reviews_archive").findOne())._archive.reason, "stranded");

  const review = await db.collection("reviews").findOne({ _id: ids.review });
  assert.strictEqual(String(review.rating), String(ids.newer), "review follows the kept rating");
  const lime = await db.collection("bubblywaters").findOne({ _id: p1 });
  assert.deepStrictEqual(lime.ratings.map(String), [String(ids.newer)]);
  assert.strictEqual(lime.averageRating, 4.5);
  assert.strictEqual((await db.collection("bubblywaters").findOne({ _id: p2 })).averageRating, 3);
  const user = await db.collection("users").findOne({ _id: u1 });
  assert.deepStrictEqual(user.ratings.map(String), [String(ids.newer), String(ids.other)], "archived and already-dangling ids dropped");
  assert.deepStrictEqual(user.likedReviews, []);

  // Now the unique index can be built, and it refuses a second rating by the same user
  await indexes.up(db);
  await assert.rejects(db.collection("ratings").insertOne({ user: u1, bubblyWater: p1, rating: 1 }), /duplicate key/);
  await db.collection("ratings").insertOne({ bubblyWater: p1, rating: 1 }); // no user: not covered
});

test("down restores every document exactly, and the pair can run again", async () => {
  await seed();
  const before = await snapshot();
  await clean.up(db);
  await indexes.up(db);
  await indexes.down(db);
  await clean.down(db);
  assert.deepStrictEqual(await snapshot(), before);
  const names = (await db.listCollections().toArray()).map((c) => c.name);
  for (const gone of ["ratings_archive", "reviews_archive", "migration_undo_202610240002"]) assert.ok(!names.includes(gone), `${gone} removed`);
  await clean.up(db);
  await indexes.up(db);
});

test("up refuses to run over an unfinished earlier run", async () => {
  await seed();
  await db.collection("migration_undo_202610240002").insertOne({ kind: "field" });
  await assert.rejects(clean.up(db), /run down first/);
});

test("a clean database is left unchanged", async () => {
  const before = await snapshot();
  await clean.up(db);
  assert.deepStrictEqual(await snapshot(), before);
  await clean.down(db);
});
