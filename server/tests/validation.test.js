// P1-3: argument validation (schemas/validation.js), literal product search, and operator-key rejection.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const { startTestServer } = require("./helpers");
const { createUser, createBubbly } = require("./fixtures");
const { Review } = require("../models");
const { hasOperatorKey } = require("../utils/rejectOperatorKeys");

let t;

before(async () => {
  t = await startTestServer();
});
after(() => t.stop());
beforeEach(() => t.reset());

const error = (res) => (res.errors ? res.errors[0] : {});
const code = (res) => error(res).extensions && error(res).extensions.code;
const id = (doc) => String(doc._id);

const SIGNUP = `mutation($u: String!, $e: String!, $p: String!) { addUser(username: $u, email: $e, password: $p) { token } }`;
const LOGIN = `mutation($e: String!, $p: String!) { login(email: $e, password: $p) { token } }`;
const ADD_RATING = `mutation($b: ID!, $r: Float!) { addRating(bubblyWaterId: $b, rating: $r) { averageRating } }`;
const ADD_REVIEW = `mutation($b: ID!, $u: ID!, $t: String!) { addReview(bubblyWaterId: $b, userId: $u, reviewText: $t) { _id } }`;
const SEARCH = `query($p: String) { search(q: $p) { results { productName } } }`;

test("signup enforces username, email and password rules", async () => {
  const cases = [
    [{ u: "ab", e: "ok@example.test", p: "longenough" }, "username", /at least 3/],
    [{ u: "has space", e: "ok@example.test", p: "longenough" }, "username", /letters, numbers/],
    [{ u: "fizzfan", e: "not-an-email", p: "longenough" }, "email", /email address/],
    [{ u: "fizzfan", e: "ok@example.test", p: "short" }, "password", /at least 8/],
    [{ u: "fizzfan", e: "ok@example.test", p: "x".repeat(73) }, "password", /at most 72/],
  ];
  for (const [vars, field, message] of cases) {
    const res = await t.gql(SIGNUP, vars);
    assert.strictEqual(code(res), "BAD_USER_INPUT", JSON.stringify(vars));
    assert.strictEqual(error(res).extensions.field, field);
    assert.match(error(res).message, message);
  }
  const ok = await t.gql(SIGNUP, { u: "  fizz_fan.2  ", e: " fizz@example.test ", p: "longenough" });
  assert.ifError(ok.errors);
});

test("existing accounts with older, shorter passwords can still log in", async () => {
  await createUser({ email: "old@example.test", password: "abcde" });
  const res = await t.gql(LOGIN, { e: "old@example.test", p: "abcde" });
  assert.ifError(res.errors);
  assert.ok(res.data.login.token);
});

test("ratings must be half steps from 0.5 to 5, and ids must be real ids", async () => {
  const user = await createUser();
  const water = await createBubbly();
  for (const r of [0, 4.3, 5.5, -1]) {
    const res = await t.gql(ADD_RATING, { b: id(water), r }, user);
    assert.strictEqual(code(res), "BAD_USER_INPUT", String(r));
  }
  const badId = await t.gql(ADD_RATING, { b: "not-an-id", r: 4 }, user);
  assert.strictEqual(code(badId), "BAD_USER_INPUT");
  assert.strictEqual(error(badId).extensions.field, "bubblyWaterId");
  assert.ifError((await t.gql(ADD_RATING, { b: id(water), r: 4.5 }, user)).errors);
});

test("reviews are trimmed, can't be blank, and max out at 500 characters", async () => {
  const user = await createUser();
  const water = await createBubbly();
  assert.match(error(await t.gql(ADD_REVIEW, { b: id(water), u: id(user), t: "   " }, user)).message, /Write something/);
  assert.match(error(await t.gql(ADD_REVIEW, { b: id(water), u: id(user), t: "x".repeat(501) }, user)).message, /max 500/);
  assert.ifError((await t.gql(ADD_REVIEW, { b: id(water), u: id(user), t: "  Crisp and limey.  " }, user)).errors);
  assert.strictEqual((await Review.findOne()).reviewText, "Crisp and limey.");
});

test("product search treats the input as plain text, not a pattern", async () => {
  await createBubbly({ productName: "Lime (Extra)" });
  await createBubbly({ productName: "Grapefruit" });
  const literal = await t.gql(SEARCH, { p: "(extra)" });
  assert.ifError(literal.errors);
  assert.deepStrictEqual(literal.data.search.results.map((b) => b.productName), ["Lime (Extra)"]);
  const pattern = await t.gql(SEARCH, { p: ".*" });
  assert.deepStrictEqual(pattern.data.search.results, [], "regex syntax doesn't match everything");
  const broken = await t.gql(SEARCH, { p: "((((" });
  assert.ifError(broken.errors);
});

test("request bodies with $ or dotted keys are turned away", async () => {
  const res = await t.request
    .post("/graphql")
    .set("Content-Type", "application/json")
    .send({ query: "{ __typename }", variables: { filter: { $gt: "" } } });
  assert.strictEqual(res.status, 400);
  assert.ok(hasOperatorKey({ a: [{ "b.c": 1 }] }));
  assert.ok(!hasOperatorKey({ a: ["$not-a-key"], b: "x.y" }), "values may contain $ and dots");
});
