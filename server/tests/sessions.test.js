// P1-6 part 1: cookie sessions (utils/sessions.js), refresh rotation, reuse detection, logout, the old
// Bearer-token grace period, CSRF, and the sessions migration.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { startTestServer } = require("./helpers");
const { createUser } = require("./fixtures");
const { Session } = require("../models");
const { signToken } = require("../utils/auth");
const { ACCESS_COOKIE, REFRESH_COOKIE, hash } = require("../utils/sessions");

let t;
before(async () => {
  t = await startTestServer();
});
after(() => t.stop());
beforeEach(() => t.reset());

const LOGIN = `mutation($e: String!, $p: String!) { login(email: $e, password: $p) { user { _id } } }`;
const ME = `{ me { username } }`;
const LOGOUT = `mutation { logout }`;

// Raw Set-Cookie headers -> { name: { value, attributes } }
const cookiesFrom = (res) =>
  Object.fromEntries(
    (res.headers["set-cookie"] || []).map((line) => {
      const [pair, ...attrs] = line.split(";").map((p) => p.trim());
      const [name, ...value] = pair.split("=");
      return [name, { value: value.join("="), attrs: attrs.map((a) => a.toLowerCase()) }];
    })
  );
const post = (body, { cookies = {}, headers = {} } = {}) => {
  const req = t.request.post("/graphql").set("Content-Type", "application/json").set(headers);
  const cookie = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
  if (cookie) req.set("Cookie", cookie);
  return req.send(body);
};
const login = async () => {
  await createUser({ username: "fizzfan", email: "fizz@example.test", password: "password123" });
  const res = await post({ query: LOGIN, variables: { e: "fizz@example.test", p: "password123" } });
  assert.ifError(res.body.errors);
  const c = cookiesFrom(res);
  return { access: c[ACCESS_COOKIE].value, refresh: c[REFRESH_COOKIE].value, raw: c };
};
const me = async (options) => (await post({ query: ME }, options)).body.data.me;

test("login sets httpOnly, SameSite=Lax session cookies, and they alone identify the user", async () => {
  const { access, refresh, raw } = await login();
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
    assert.ok(raw[name].attrs.includes("httponly"), `${name} httpOnly`);
    assert.ok(raw[name].attrs.includes("samesite=lax"), `${name} SameSite=Lax`);
  }
  assert.ok(raw[ACCESS_COOKIE].attrs.some((a) => a === "max-age=900"), "access lives 15 minutes");
  assert.strictEqual((await me({ cookies: { [ACCESS_COOKIE]: access } })).username, "fizzfan");
  const stored = await Session.findOne();
  assert.strictEqual(stored.tokenHash, hash(refresh), "only the hash is stored");
  assert.notStrictEqual(stored.tokenHash, refresh);
});

test("without an access cookie, the refresh cookie rotates to a new pair", async () => {
  const { refresh } = await login();
  const res = await post({ query: ME }, { cookies: { [REFRESH_COOKIE]: refresh } });
  assert.strictEqual(res.body.data.me.username, "fizzfan");
  const next = cookiesFrom(res);
  assert.ok(next[ACCESS_COOKIE] && next[REFRESH_COOKIE], "new cookies set");
  assert.notStrictEqual(next[REFRESH_COOKIE].value, refresh);
  const old = await Session.findOne({ tokenHash: hash(refresh) });
  assert.ok(old.revokedAt && old.replacedBy, "old token retired");
  assert.strictEqual((await me({ cookies: { [REFRESH_COOKIE]: next[REFRESH_COOKIE].value } })).username, "fizzfan");
});

test("a rotated refresh token reused later signs the user out everywhere; a near-simultaneous reuse doesn't", async () => {
  const { refresh } = await login();
  const rotated = cookiesFrom(await post({ query: ME }, { cookies: { [REFRESH_COOKIE]: refresh } }));
  // Same page load, sibling request with the old token: still fine
  assert.strictEqual((await me({ cookies: { [REFRESH_COOKIE]: refresh } })).username, "fizzfan");

  await Session.updateOne({ tokenHash: hash(refresh) }, { $set: { revokedAt: new Date(Date.now() - 60 * 1000) } });
  assert.strictEqual(await me({ cookies: { [REFRESH_COOKIE]: refresh } }), null, "stolen copy rejected");
  assert.strictEqual(await Session.countDocuments({ revokedAt: null }), 0, "every session revoked");
  assert.strictEqual(await me({ cookies: { [REFRESH_COOKIE]: rotated[REFRESH_COOKIE].value } }), null);
});

test("logout revokes the session and clears both cookies", async () => {
  const { access, refresh } = await login();
  const res = await post({ query: LOGOUT }, { cookies: { [ACCESS_COOKIE]: access, [REFRESH_COOKIE]: refresh } });
  assert.strictEqual(res.body.data.logout, true);
  const cleared = cookiesFrom(res);
  assert.strictEqual(cleared[ACCESS_COOKIE].value, "");
  assert.strictEqual(cleared[REFRESH_COOKIE].value, "");
  assert.strictEqual(await me({ cookies: { [REFRESH_COOKIE]: refresh } }), null);
});

test("a password reset signs out every session", async () => {
  const { refresh } = await login();
  const user = await mongoose.model("User").findOne({ email: "fizz@example.test" });
  user.passwordResetToken = "reset-token";
  user.passwordResetExpires = new Date(Date.now() + 60 * 1000);
  await user.save();
  const reset = await post({
    query: `mutation { resetPassword(token: "reset-token", email: "fizz@example.test", newPassword: "brandnew99") { user { _id } } }`,
  });
  assert.ifError(reset.body.errors);
  assert.strictEqual(await me({ cookies: { [REFRESH_COOKIE]: refresh } }), null);
});

test("old localStorage tokens still work during the grace period and move the browser onto cookies", async () => {
  const user = await createUser({ username: "legacy", email: "legacy@example.test" });
  const old = signToken({ email: user.email, name: user.username, _id: user._id });
  const res = await post({ query: ME }, { headers: { Authorization: `Bearer ${old}` } });
  assert.strictEqual(res.body.data.me.username, "legacy");
  const c = cookiesFrom(res);
  assert.ok(c[ACCESS_COOKIE] && c[REFRESH_COOKIE], "upgraded to a cookie session");

  process.env.BEARER_GRACE_UNTIL = "2020-01-01";
  try {
    assert.strictEqual(await me({ headers: { Authorization: `Bearer ${old}` } }), null, "refused after the grace period");
  } finally {
    delete process.env.BEARER_GRACE_UNTIL;
  }
});

test("tokens in the body or query string are ignored, and an access cookie can't be replayed as a Bearer token", async () => {
  const { access } = await login();
  const user = await mongoose.model("User").findOne({ email: "fizz@example.test" });
  const old = signToken({ email: user.email, name: user.username, _id: user._id });
  assert.strictEqual((await post({ query: ME, token: old })).body.data.me, null);
  const viaQuery = await t.request.post(`/graphql?token=${old}`).set("Content-Type", "application/json").send({ query: ME });
  assert.strictEqual(viaQuery.body.data.me, null);
  assert.strictEqual(await me({ headers: { Authorization: `Bearer ${access}` } }), null);
  assert.strictEqual(jwt.decode(access).use, "access");
});

test("cross-site form posts are refused (CSRF prevention)", async () => {
  const res = await t.request.post("/graphql").set("Content-Type", "text/plain").send(JSON.stringify({ query: LOGOUT }));
  assert.strictEqual(res.status, 400);
});

test("the sessions migration creates a unique token index and an expiry (TTL) index, and down removes it", async () => {
  const migration = require("../../migrations/202610230002-create-sessions");
  const db = mongoose.connection.db;
  const indexes = await db.collection("sessions").indexes();
  assert.ok(indexes.find((i) => i.name === "tokenHash_1").unique);
  assert.strictEqual(indexes.find((i) => i.name === "expiresAt_ttl").expireAfterSeconds, 0);
  await migration.down(db);
  assert.strictEqual(await db.listCollections({ name: "sessions" }).hasNext(), false);
  await migration.up(db);
  await migration.up(db); // safe to run twice
  assert.strictEqual(await db.listCollections({ name: "sessions" }).hasNext(), true);
});
