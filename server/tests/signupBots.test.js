// P1-8: bot friction on signup. The honeypot, and Turnstile verification with Cloudflare's API stubbed.
const { test, describe, before, after, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert");
const { startTestServer } = require("./helpers");
const { User } = require("../models");
const { VERIFY_URL } = require("../utils/turnstile");

let t;
before(async () => {
  t = await startTestServer();
});
after(() => t.stop());
beforeEach(() => t.reset());

const SIGNUP = `mutation($u: String!, $e: String!, $p: String!, $w: String, $tt: String) {
  addUser(username: $u, email: $e, password: $p, website: $w, turnstileToken: $tt) { user { username } }
}`;
const vars = (extra = {}) => ({ u: "fizzfan", e: "fizz@example.test", p: "password123", ...extra });

test("a filled-in honeypot looks like success but creates nothing", async () => {
  const res = await t.gql(SIGNUP, vars({ w: "http://spam.example" }));
  assert.ifError(res.errors);
  assert.strictEqual(res.data.addUser.user, null);
  assert.strictEqual(await User.countDocuments(), 0);
  assert.strictEqual(t.outbox.length, 0, "no verification email either");
});

test("without TURNSTILE_SECRET, signups don't need a token", async () => {
  assert.ifError((await t.gql(SIGNUP, vars())).errors);
});

describe("Turnstile turned on", () => {
  const realFetch = global.fetch;
  let calls;
  const stub = (success) => {
    global.fetch = async (url, options) => {
      if (url !== VERIFY_URL) return realFetch(url, options);
      calls.push(Object.fromEntries(options.body));
      return { json: async () => ({ success }) };
    };
  };
  beforeEach(() => {
    calls = [];
    process.env.TURNSTILE_SECRET = "test-secret";
  });
  afterEach(() => {
    global.fetch = realFetch;
    delete process.env.TURNSTILE_SECRET;
  });

  test("with Turnstile on, a missing token is refused without asking Cloudflare", async () => {
    stub(true);
    const res = await t.gql(SIGNUP, vars());
    assert.strictEqual(res.errors[0].extensions.field, "turnstileToken");
    assert.strictEqual(calls.length, 0);
    assert.strictEqual(await User.countDocuments(), 0);
  });

  test("with Turnstile on, Cloudflare's verdict decides", async () => {
    stub(false);
    assert.match((await t.gql(SIGNUP, vars({ tt: "bad-token" }))).errors[0].message, /verify you're human/);
    assert.deepStrictEqual({ secret: calls[0].secret, response: calls[0].response }, { secret: "test-secret", response: "bad-token" });
    stub(true);
    assert.ifError((await t.gql(SIGNUP, vars({ tt: "good-token" }))).errors);
    assert.strictEqual(await User.countDocuments(), 1);
  });

  test("if Cloudflare can't be reached, signup fails closed", async () => {
    global.fetch = async (url, options) => {
      if (url === VERIFY_URL) throw new Error("network down");
      return realFetch(url, options);
    };
    assert.ok((await t.gql(SIGNUP, vars({ tt: "any" }))).errors);
    assert.strictEqual(await User.countDocuments(), 0);
  });
});
