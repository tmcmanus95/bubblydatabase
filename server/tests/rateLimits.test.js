// P1-2: rate limits on /graphql (utils/rateLimits.js) and trust proxy for Render.
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const supertest = require("supertest");
const { startTestServer } = require("./helpers");
const { createApp } = require("../app");
const { mutationFieldCounts, DEFAULT_LIMITS } = require("../utils/rateLimits");

const WINDOW = 60 * 1000;
const small = (limit) => ({ windowMs: WINDOW, limit });
const LIMITS = {
  global: small(1000),
  mutations: Object.fromEntries(Object.keys(DEFAULT_LIMITS.mutations).map((name) => [name, small(2)])),
};

let t;
before(async () => {
  t = await startTestServer({ rateLimits: LIMITS });
});
after(() => t.stop());

const send = (body, headers = {}) => t.request.post("/graphql").set("Content-Type", "application/json").set(headers).send(body);
const LOGIN = { query: `mutation { login(email: "nobody@example.test", password: "wrong-password") { token } }` };

test("login is limited per IP and answers 429 with a GraphQL-shaped error", async () => {
  for (let i = 0; i < 2; i++) assert.strictEqual((await send(LOGIN)).status, 200);
  const res = await send(LOGIN);
  assert.strictEqual(res.status, 429);
  assert.strictEqual(res.body.errors[0].extensions.code, "RATE_LIMITED");
  assert.ok(res.headers["ratelimit-policy"], "standard RateLimit headers are sent");

  // Other operations from the same IP still work
  const query = await send({ query: "{ __typename }" });
  assert.strictEqual(query.status, 200);
});

test("renaming the operation doesn't dodge a limit: the parsed query decides", async () => {
  const forgot = (name) => ({
    query: `mutation ${name} { forgotPassword(email: "nobody@example.test") }`,
    operationName: name,
  });
  assert.strictEqual((await send(forgot("One"))).status, 200);
  assert.strictEqual((await send(forgot("Two"))).status, 200);
  assert.strictEqual((await send(forgot("SomethingInnocent"))).status, 429);
});

test("aliases can't pack several attempts into one request", async () => {
  const res = await send({
    query: `mutation { a: resetPassword(token: "x", password: "y") b: resetPassword(token: "x", password: "y") }`,
  });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.errors[0].extensions.code, "BAD_REQUEST");
});

test("mutationFieldCounts reads mutations only, and survives junk", () => {
  assert.deepStrictEqual(mutationFieldCounts({ query: "mutation { login(email: \"a\", password: \"b\") { token } addUser { token } }" }), {
    login: 1,
    addUser: 1,
  });
  assert.deepStrictEqual(mutationFieldCounts({ query: "{ login }" }), {}, "queries don't count");
  assert.deepStrictEqual(mutationFieldCounts({ query: "mutation {" }), {});
  assert.deepStrictEqual(mutationFieldCounts({}), {});
});

// No database needed below: `{ __typename }` never reaches a resolver that queries MongoDB.
const appWith = async (nodeEnv, trustProxy) => {
  const saved = { NODE_ENV: process.env.NODE_ENV, TRUST_PROXY: process.env.TRUST_PROXY };
  process.env.NODE_ENV = nodeEnv;
  if (trustProxy === undefined) delete process.env.TRUST_PROXY;
  else process.env.TRUST_PROXY = trustProxy;
  try {
    return await createApp({ rateLimits: { global: small(1), mutations: {} } });
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};
const fromIp = (app, ip) =>
  supertest(app).post("/graphql").set("Content-Type", "application/json").set("X-Forwarded-For", ip).send({ query: "{ __typename }" });

test("production trusts Render's one proxy, so each visitor gets their own limit", async () => {
  const { app, server } = await appWith("production");
  try {
    assert.strictEqual((await fromIp(app, "203.0.113.1")).status, 200);
    assert.strictEqual((await fromIp(app, "203.0.113.1")).status, 429);
    assert.strictEqual((await fromIp(app, "203.0.113.2")).status, 200, "a different visitor isn't blocked");
    // A spoofed extra hop: only the address the proxy saw counts
    assert.strictEqual((await fromIp(app, "198.51.100.9, 203.0.113.1")).status, 429);
  } finally {
    await server.stop();
  }
});

test("without a proxy (development), X-Forwarded-For is ignored", async () => {
  const { app, server } = await appWith("development");
  try {
    assert.strictEqual((await fromIp(app, "203.0.113.1")).status, 200);
    assert.strictEqual((await fromIp(app, "203.0.113.2")).status, 429, "a faked header can't reset the limit");
  } finally {
    await server.stop();
  }
});

test("the client-IP diagnostic header only appears when DEBUG_CLIENT_IP is on", async () => {
  const off = await t.request.post("/graphql").set("Content-Type", "application/json").send({ query: "{ __typename }" });
  assert.strictEqual(off.headers["x-debug-client-ip"], undefined);
  process.env.DEBUG_CLIENT_IP = "true";
  try {
    const on = await t.request.post("/graphql").set("Content-Type", "application/json").send({ query: "{ __typename }" });
    assert.ok(JSON.parse(on.headers["x-debug-client-ip"]).ip);
  } finally {
    delete process.env.DEBUG_CLIENT_IP;
  }
});
