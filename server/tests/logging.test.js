// P1-9: error masking in production, request logs without secrets, and the health check.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const { Writable } = require("stream");
const supertest = require("supertest");
const { startTestServer } = require("./helpers");
const { createUser } = require("./fixtures");
const { BubblyWater } = require("../models");
const { createApp } = require("../app");
const { createLogger } = require("../utils/logging");

let t;
let prod;
const lines = [];
const capture = new Writable({
  write(chunk, encoding, done) {
    lines.push(...chunk.toString().trim().split("\n").map((l) => JSON.parse(l)));
    done();
  },
});

before(async () => {
  t = await startTestServer(); // connects the in-memory database
  const saved = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    prod = await createApp({ rateLimits: false, logger: createLogger({}, capture) });
  } finally {
    process.env.NODE_ENV = saved;
  }
});
after(async () => {
  await prod.server.stop();
  await t.stop();
});
beforeEach(async () => {
  lines.length = 0;
  await t.reset();
});

const gql = (body, cookie) => {
  const req = supertest(prod.app).post("/graphql").set("Content-Type", "application/json");
  if (cookie) req.set("Cookie", cookie);
  return req.send(body);
};

test("in production, crashes and database errors are hidden behind a reference; our own messages aren't", async () => {
  const realFind = BubblyWater.find;
  BubblyWater.find = () => {
    throw new TypeError("Cannot read properties of undefined (reading 'secretInternalField')");
  };
  try {
    const res = await gql({ query: "{ caffeinatedBubblys { _id } }" });
    const error = res.body.errors[0];
    assert.match(error.message, /^Something went wrong\. Please try again\. \(ref [0-9a-f]{8}\)$/);
    assert.doesNotMatch(JSON.stringify(res.body), /secretInternalField/);
    const logged = lines.find((l) => l.ref === error.extensions.ref);
    assert.ok(logged, "the full error is logged under the same reference");
    assert.match(logged.err.message, /secretInternalField/);
  } finally {
    BubblyWater.find = realFind;
  }
  // Messages written for people, and public codes, pass through
  const notFound = await gql({ query: `{ usersRatings(userId: "${"a".repeat(24)}", numRange: "1-5") { _id } }` });
  assert.strictEqual(notFound.body.errors[0].message, "User not found");
  const badInput = await gql({ query: `{ bubblyWater(bubblyWaterId: "nope") { _id } }` });
  assert.strictEqual(badInput.body.errors[0].extensions.code, "BAD_USER_INPUT");
});

test("request logs carry method, path, status, id and operation, never passwords, cookies or tokens", async () => {
  await createUser({ email: "log@example.test", password: "hunter2-secret" });
  const res = await gql(
    { operationName: "login", query: `mutation login { login(email: "log@example.test", password: "hunter2-secret") { user { _id } } }` },
    "bubbly_refresh=super-secret-refresh"
  );
  assert.ok(res.headers["x-request-id"]);
  const entry = lines.find((l) => l.req && l.req.id === res.headers["x-request-id"]);
  assert.ok(entry, "one line per request");
  assert.strictEqual(entry.req.method, "POST");
  assert.strictEqual(entry.req.url, "/graphql");
  assert.strictEqual(entry.res.statusCode, 200);
  assert.strictEqual(entry.operation, "login");
  const all = JSON.stringify(lines);
  for (const secret of ["hunter2-secret", "super-secret-refresh", "bubbly_access=", "log@example.test"]) {
    assert.ok(!all.includes(secret), `${secret} must not be logged`);
  }
});

test("/healthz reports the app and database are up", async () => {
  const res = await supertest(prod.app).get("/healthz");
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(res.body, { ok: true });
});
