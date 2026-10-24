// P1-15: every rating/review write keeps the product's stored aggregates equal to the raw collections,
// and removals clean up their references.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const { startTestServer } = require("./helpers");
const { createUser, createBubbly } = require("./fixtures");
const { User, BubblyWater, Rating, Review } = require("../models");
const { integrityReport } = require("../scripts/lib/integrity");

let t;
before(async () => {
  t = await startTestServer();
});
after(() => t.stop());
beforeEach(() => t.reset());

const id = (doc) => String(doc._id);
const RATE = `mutation($b: ID!, $r: Float!) { addRating(bubblyWaterId: $b, rating: $r) { averageRating } }`;
const EDIT = `mutation($id: ID!, $r: Float!) { editRating(ratingId: $id, rating: $r) { rating } }`;
const UNRATE = `mutation($id: ID!) { removeRating(ratingId: $id) { _id } }`;
const REVIEW = `mutation($b: ID!, $u: ID!, $t: String!) { addReview(bubblyWaterId: $b, userId: $u, reviewText: $t) { _id } }`;
const UNREVIEW = `mutation($id: ID!) { removeReview(reviewId: $id) { _id } }`;
const LIKE = `mutation($u: ID!, $id: ID!) { addLikeToReview(userId: $u, reviewId: $id) { username } }`;

const stored = async (water) => {
  const p = await BubblyWater.findById(water._id).lean();
  return { avgRating: p.avgRating, ratingCount: p.ratingCount, reviewCount: p.reviewCount, averageRating: p.averageRating };
};
const noDrift = async () => assert.deepStrictEqual((await integrityReport(mongoose.connection.db)).aggregateDrift, []);
const ok = (res) => {
  assert.ifError(res.errors);
  return res.data;
};

test("add, re-rate, edit and remove keep avgRating, ratingCount and averageRating exact", async () => {
  const [a, b, c] = await Promise.all([createUser(), createUser(), createUser()]);
  const water = await createBubbly();
  ok(await t.gql(RATE, { b: id(water), r: 4 }, a));
  ok(await t.gql(RATE, { b: id(water), r: 2 }, b));
  assert.deepStrictEqual(await stored(water), { avgRating: 3, ratingCount: 2, reviewCount: 0, averageRating: 3 });
  ok(await t.gql(RATE, { b: id(water), r: 5 }, a)); // re-rate = update
  assert.deepStrictEqual(await stored(water), { avgRating: 3.5, ratingCount: 2, reviewCount: 0, averageRating: 3.5 });
  ok(await t.gql(RATE, { b: id(water), r: 3 }, c));
  const cRating = await Rating.findOne({ user: c._id });
  ok(await t.gql(EDIT, { id: id(cRating), r: 0.5 }, c));
  await noDrift();
  const aRating = await Rating.findOne({ user: a._id });
  ok(await t.gql(UNRATE, { id: id(aRating) }, a));
  assert.deepStrictEqual(await stored(water), { avgRating: 1.25, ratingCount: 2, reviewCount: 0, averageRating: 1.25 });
  await noDrift();
  for (const u of [b, c]) ok(await t.gql(UNRATE, { id: id(await Rating.findOne({ user: u._id })) }, u));
  assert.deepStrictEqual(await stored(water), { avgRating: 0, ratingCount: 0, reviewCount: 0, averageRating: 0 });
});

test("removing a rating pulls it from the product and user, and unlinks reviews", async () => {
  const a = await createUser();
  const water = await createBubbly();
  ok(await t.gql(REVIEW, { b: id(water), u: id(a), t: "Zesty" }, a));
  ok(await t.gql(RATE, { b: id(water), r: 4 }, a)); // rating after review: gets linked
  const rating = await Rating.findOne({ user: a._id });
  assert.strictEqual(String((await Review.findOne()).rating), id(rating));
  ok(await t.gql(UNRATE, { id: id(rating) }, a));
  assert.deepStrictEqual((await BubblyWater.findById(water._id)).ratings, []);
  assert.deepStrictEqual((await User.findById(a._id)).ratings, []);
  assert.strictEqual((await Review.findOne()).rating, null);
});

test("reviews keep reviewCount exact; removing one pulls it from the product, author and likers", async () => {
  const [a, b] = await Promise.all([createUser(), createUser()]);
  const water = await createBubbly();
  ok(await t.gql(REVIEW, { b: id(water), u: id(a), t: "Zesty" }, a));
  ok(await t.gql(REVIEW, { b: id(water), u: id(b), t: "Flat" }, b));
  assert.strictEqual((await stored(water)).reviewCount, 2);
  const review = await Review.findOne({ user: a._id });
  ok(await t.gql(LIKE, { u: id(b), id: id(review) }, b));
  ok(await t.gql(UNREVIEW, { id: id(review) }, a));
  assert.strictEqual((await stored(water)).reviewCount, 1);
  assert.strictEqual((await BubblyWater.findById(water._id)).reviews.length, 1);
  assert.deepStrictEqual((await User.findById(a._id)).reviews, []);
  assert.deepStrictEqual((await User.findById(b._id)).likedReviews, []);
  await noDrift();
});

test("rating a product that doesn't exist creates nothing", async () => {
  const a = await createUser();
  const res = await t.gql(RATE, { b: String(new mongoose.Types.ObjectId()), r: 4 }, a);
  assert.match(res.errors[0].message, /not found/);
  assert.strictEqual(await Rating.countDocuments(), 0);
});

test("ten users rating at once leave exact aggregates", async () => {
  const users = await Promise.all(Array.from({ length: 10 }, () => createUser()));
  const water = await createBubbly();
  await Promise.all(users.map((u, i) => t.gql(RATE, { b: id(water), r: 0.5 + (i % 10) * 0.5 }, u)));
  const s = await stored(water);
  assert.strictEqual(s.ratingCount, 10);
  assert.ok(Math.abs(s.avgRating - 2.75) < 1e-9, `avg ${s.avgRating}`);
});
