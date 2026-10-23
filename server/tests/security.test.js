// P1-1: security headers, CSP, CORS and request size limits. These don't need a database.
process.env.MY_SECRET = "test-only-secret";
process.env.EMAIL_MODE = "log";

const { test, before, after } = require("node:test");
const assert = require("node:assert");
const supertest = require("supertest");
const { createApp } = require("../app");

const QUERY = { query: "{ __typename }" };
let dev, prod;

before(async () => {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  dev = await createApp();
  process.env.NODE_ENV = "production";
  prod = await createApp();
  process.env.NODE_ENV = original;
});

after(async () => {
  await dev.server.stop();
  await prod.server.stop();
});

const post = (app, headers = {}) => supertest(app).post("/graphql").set("Content-Type", "application/json").set(headers);

test("security headers are set and X-Powered-By is gone", async () => {
  const res = await post(dev.app).send(QUERY);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.headers["x-content-type-options"], "nosniff");
  assert.ok(res.headers["strict-transport-security"]);
  assert.ok(res.headers["referrer-policy"]);
  assert.strictEqual(res.headers["x-powered-by"], undefined);
});

test("the CSP is sent in production and allows exactly what the site uses", async () => {
  const csp = (await post(prod.app).send(QUERY)).headers["content-security-policy"];
  assert.ok(csp, "CSP header missing in production");
  const directives = Object.fromEntries(
    csp.split(";").map((d) => d.trim().split(/\s+/)).filter((p) => p[0]).map(([name, ...values]) => [name, values])
  );
  assert.deepStrictEqual(directives["script-src"], ["'self'"]);
  assert.ok(directives["style-src"].includes("https://fonts.googleapis.com"));
  assert.ok(directives["font-src"].includes("https://fonts.gstatic.com"));
  assert.ok(directives["connect-src"].includes("https://formspree.io"));
  assert.deepStrictEqual(directives["frame-ancestors"], ["'none'"]);
  assert.deepStrictEqual(directives["object-src"], ["'none'"]);
  assert.deepStrictEqual(directives["img-src"], ["'self'", "data:"], "no third-party images");
});

test("no CSP in development, where Vite serves the client", async () => {
  const res = await post(dev.app).send(QUERY);
  assert.strictEqual(res.headers["content-security-policy"], undefined);
});

test("CORS: other sites get no access unless listed in CORS_ORIGINS", async () => {
  const evil = await post(dev.app, { Origin: "https://evil.example" }).send(QUERY);
  assert.strictEqual(evil.headers["access-control-allow-origin"], undefined);

  process.env.CORS_ORIGINS = "https://friend.example, https://other.example";
  try {
    const friend = await post(dev.app, { Origin: "https://friend.example" }).send(QUERY);
    assert.strictEqual(friend.headers["access-control-allow-origin"], "https://friend.example");
    const preflight = await supertest(dev.app)
      .options("/graphql")
      .set("Origin", "https://other.example")
      .set("Access-Control-Request-Method", "POST");
    assert.strictEqual(preflight.headers["access-control-allow-origin"], "https://other.example");
    const stillEvil = await post(dev.app, { Origin: "https://evil.example" }).send(QUERY);
    assert.strictEqual(stillEvil.headers["access-control-allow-origin"], undefined);
  } finally {
    delete process.env.CORS_ORIGINS;
  }
});

test("request bodies over 100kb are rejected", async () => {
  const big = { query: "{ __typename }", variables: { padding: "x".repeat(110 * 1024) } };
  const res = await post(dev.app).send(big);
  assert.strictEqual(res.status, 413);
  const ok = await post(dev.app).send({ query: "{ __typename }", variables: { padding: "x".repeat(50 * 1024) } });
  assert.strictEqual(ok.status, 200);
});

test("form-encoded bodies are no longer parsed", async () => {
  const res = await supertest(dev.app)
    .post("/graphql")
    .set("Content-Type", "application/x-www-form-urlencoded")
    .send("query=%7B__typename%7D");
  assert.notStrictEqual(res.status, 200);
});
