// P1-22: one request for the logged-in user's ratings on a page of products.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const { startTestServer } = require("./helpers");
const { createUser, createBubbly, addRatingFor } = require("./fixtures");

let t;
before(async () => {
  t = await startTestServer();
});
after(() => t.stop());
beforeEach(() => t.reset());

const MY = `query($ids: [ID!]!) { myRatings(bubblyWaterIds: $ids) { _id rating bubblyWaterId } }`;

test("returns only my ratings for the products asked about, with product ids", async () => {
  const [me, other] = await Promise.all([createUser(), createUser()]);
  const [a, b, c] = await Promise.all([createBubbly({ productName: "A" }), createBubbly({ productName: "B" }), createBubbly({ productName: "C" })]);
  await addRatingFor(me, a, 4);
  await addRatingFor(me, c, 2.5);
  await addRatingFor(other, b, 5);
  const res = await t.gql(MY, { ids: [String(a._id), String(b._id)] }, me);
  assert.ifError(res.errors);
  assert.deepStrictEqual(res.data.myRatings.map((r) => [r.bubblyWaterId, r.rating]), [[String(a._id), 4]]);
});

test("logged out gets an empty list; more than 100 ids is refused", async () => {
  const a = await createBubbly();
  assert.deepStrictEqual((await t.gql(MY, { ids: [String(a._id)] })).data.myRatings, []);
  const many = Array.from({ length: 101 }, () => String(a._id));
  assert.strictEqual((await t.gql(MY, { ids: many }, await createUser())).errors[0].extensions.code, "BAD_USER_INPUT");
});
