// P0-12 smoke tests: rating, reviewing and liking, plus the P0-0 authorization rules (logged-in user
// only, owners or admins for edits, admin-only user removal).
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const { startTestServer } = require("./helpers");
const { createUser, createBubbly } = require("./fixtures");
const { User, BubblyWater, Rating, Review } = require("../models");

let t;

before(async () => {
  t = await startTestServer();
});
after(() => t.stop());
beforeEach(() => t.reset());

const code = (res) => res.errors && res.errors[0].extensions && res.errors[0].extensions.code;
const id = (doc) => String(doc._id);

const ADD_RATING = `mutation($b: ID!, $u: ID, $r: Float!) { addRating(bubblyWaterId: $b, userId: $u, rating: $r) { averageRating } }`;
const EDIT_RATING = `mutation($id: ID!, $r: Float!, $b: ID) { editRating(ratingId: $id, rating: $r, bubblyWaterId: $b) { rating } }`;
const REMOVE_RATING = `mutation($id: ID!) { removeRating(ratingId: $id) { _id } }`;
const ADD_REVIEW = `mutation($b: ID!, $u: ID!, $t: String!) { addReview(bubblyWaterId: $b, userId: $u, reviewText: $t) { _id } }`;
const EDIT_REVIEW = `mutation($id: ID!, $t: String!) { editReview(reviewId: $id, reviewText: $t) { reviewText } }`;
const REMOVE_REVIEW = `mutation($id: ID!) { removeReview(reviewId: $id) { _id } }`;
const LIKE = `mutation($u: ID!, $id: ID!) { addLikeToReview(userId: $u, reviewId: $id) { username } }`;
const UNLIKE = `mutation($u: ID!, $id: ID!) { removeLikeFromReview(userId: $u, reviewId: $id) { username } }`;

test("rating: logged-in users rate once, in half steps, and the average updates", async () => {
  const [alice, bob] = await Promise.all([createUser(), createUser()]);
  const water = await createBubbly();

  assert.strictEqual(code(await t.gql(ADD_RATING, { b: id(water), r: 4 })), "UNAUTHENTICATED");

  let res = await t.gql(ADD_RATING, { b: id(water), r: 4 }, alice);
  assert.strictEqual(res.data.addRating.averageRating, 4);
  res = await t.gql(ADD_RATING, { b: id(water), r: 3 }, bob);
  assert.strictEqual(res.data.addRating.averageRating, 3.5);

  assert.match((await t.gql(ADD_RATING, { b: id(water), r: 5 }, alice)).errors[0].message, /already rated/);
  for (const r of [0, 5.5, 3.3, -1]) {
    assert.match((await t.gql(ADD_RATING, { b: id(water), r }, bob)).errors[0].message, /between 0.5 and 5/, String(r));
  }
  assert.strictEqual((await User.findById(alice._id)).ratings.length, 1, "linked on the user");
  assert.strictEqual((await BubblyWater.findById(water._id)).ratings.length, 2, "linked on the product");
});

test("rating: a client-supplied userId is ignored", async () => {
  const [alice, mallory] = await Promise.all([createUser(), createUser()]);
  const water = await createBubbly();
  await t.gql(ADD_RATING, { b: id(water), u: id(alice), r: 1 }, mallory);
  const rating = await Rating.findOne({ bubblyWater: water._id });
  assert.ok(rating.user.equals(mallory._id));
  assert.strictEqual(await Rating.countDocuments({ user: alice._id }), 0);
});

test("rating: only the owner (or an admin) can edit or remove it; averages follow edits", async () => {
  const [alice, bob, admin] = await Promise.all([createUser(), createUser(), createUser()]);
  const water = await createBubbly();
  await t.gql(ADD_RATING, { b: id(water), r: 2 }, alice);
  await t.gql(ADD_RATING, { b: id(water), r: 4 }, bob);
  const aliceRating = await Rating.findOne({ user: alice._id });

  assert.strictEqual(code(await t.gql(EDIT_RATING, { id: id(aliceRating), r: 5 })), "UNAUTHENTICATED");
  assert.strictEqual(code(await t.gql(EDIT_RATING, { id: id(aliceRating), r: 5 }, bob)), "FORBIDDEN");
  // A bogus bubblyWaterId can't redirect the recalculation to another product
  const other = await createBubbly({ productName: "Other" });
  const res = await t.gql(EDIT_RATING, { id: id(aliceRating), r: 5, b: id(other) }, alice);
  assert.strictEqual(res.data.editRating.rating, 5);
  assert.strictEqual((await BubblyWater.findById(water._id)).averageRating, 4.5);
  assert.strictEqual((await BubblyWater.findById(other._id)).averageRating, 0);

  assert.strictEqual(code(await t.gql(REMOVE_RATING, { id: id(aliceRating) }, bob)), "FORBIDDEN");
  assert.ok(await Rating.findById(aliceRating._id));
  process.env.ADMIN_USER_IDS = id(admin);
  try {
    assert.ifError((await t.gql(REMOVE_RATING, { id: id(aliceRating) }, admin)).errors);
    assert.strictEqual(await Rating.findById(aliceRating._id), null);
  } finally {
    process.env.ADMIN_USER_IDS = "";
  }
});

test("reviews: verified users only, linked to their rating; owners edit; others can't", async () => {
  const alice = await createUser({ isVerified: true });
  const unverified = await createUser({ isVerified: false });
  const bob = await createUser();
  const water = await createBubbly();
  await t.gql(ADD_RATING, { b: id(water), r: 4.5 }, alice);

  assert.strictEqual(code(await t.gql(ADD_REVIEW, { b: id(water), u: id(alice), t: "fizz" })), "UNAUTHENTICATED");
  assert.match((await t.gql(ADD_REVIEW, { b: id(water), u: id(unverified), t: "fizz" }, unverified)).errors[0].message, /verify your email/);

  assert.ifError((await t.gql(ADD_REVIEW, { b: id(water), u: id(bob), t: "Very bubbly." }, alice)).errors);
  const review = await Review.findOne({});
  assert.ok(review.user.equals(alice._id), "saved as the logged-in user, not the userId argument");
  assert.ok(review.rating.equals((await Rating.findOne({ user: alice._id }))._id));
  assert.strictEqual((await User.findById(alice._id)).reviews.length, 1);

  assert.strictEqual(code(await t.gql(EDIT_REVIEW, { id: id(review), t: "hacked" }, bob)), "FORBIDDEN");
  assert.strictEqual(code(await t.gql(REMOVE_REVIEW, { id: id(review) }, bob)), "FORBIDDEN");
  const edited = await t.gql(EDIT_REVIEW, { id: id(review), t: "Extremely bubbly." }, alice);
  assert.strictEqual(edited.data.editReview.reviewText, "Extremely bubbly.");
  assert.ifError((await t.gql(REMOVE_REVIEW, { id: id(review) }, alice)).errors);
  assert.strictEqual(await Review.findById(review._id), null);
});

test("likes: always recorded for the logged-in user, once each", async () => {
  const [alice, bob] = await Promise.all([createUser(), createUser()]);
  const water = await createBubbly();
  const review = await Review.create({ reviewText: "Crisp.", user: alice._id, bubblyWater: water._id });

  assert.strictEqual(code(await t.gql(LIKE, { u: id(alice), id: id(review) })), "UNAUTHENTICATED");
  assert.ifError((await t.gql(LIKE, { u: id(alice), id: id(review) }, bob)).errors);
  assert.strictEqual((await User.findById(bob._id)).likedReviews.length, 1);
  assert.strictEqual((await User.findById(alice._id)).likedReviews.length, 0);
  assert.strictEqual((await Review.findById(review._id)).likes, 1);

  assert.ok((await t.gql(LIKE, { u: id(bob), id: id(review) }, bob)).errors, "can't like twice");
  assert.ifError((await t.gql(UNLIKE, { u: id(bob), id: id(review) }, bob)).errors);
  assert.strictEqual((await Review.findById(review._id)).likes, 0);
});

test("profile color: self or admin only", async () => {
  const [alice, bob] = await Promise.all([createUser(), createUser()]);
  const COLOR = `mutation($u: ID!, $c: String) { editUserColor(userId: $u, color: $c) { color } }`;
  assert.strictEqual(code(await t.gql(COLOR, { u: id(alice), c: "user-red" }, bob)), "FORBIDDEN");
  const res = await t.gql(COLOR, { u: id(alice), c: "user-red" }, alice);
  assert.strictEqual(res.data.editUserColor.color, "user-red");
});

test("removeUser: admins only, never self-service or anonymous", async () => {
  const [alice, admin] = await Promise.all([createUser(), createUser()]);
  const REMOVE_USER = `mutation($u: ID!) { removeUser(userId: $u) { username } }`;

  assert.strictEqual(code(await t.gql(REMOVE_USER, { u: id(alice) })), "UNAUTHENTICATED");
  assert.strictEqual(code(await t.gql(REMOVE_USER, { u: id(alice) }, alice)), "FORBIDDEN");
  assert.strictEqual(code(await t.gql(REMOVE_USER, { u: id(alice) }, admin)), "FORBIDDEN", "not an admin until listed");

  process.env.ADMIN_USER_IDS = ` ${id(admin)} `;
  try {
    assert.ifError((await t.gql(REMOVE_USER, { u: id(alice) }, admin)).errors);
    assert.strictEqual(await User.findById(alice._id), null);
  } finally {
    process.env.ADMIN_USER_IDS = "";
  }
});
