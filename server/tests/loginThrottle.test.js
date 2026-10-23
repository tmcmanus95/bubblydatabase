// P1-4: login backoff and lockout (utils/loginThrottle.js), unit-tested with a fake clock, plus the
// login mutation end to end.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const { createLoginThrottle } = require("../utils/loginThrottle");
const { startTestServer } = require("./helpers");
const { createUser } = require("./fixtures");

const clock = () => {
  let t = 1_000_000;
  return { now: () => t, advance: (ms) => (t += ms) };
};
const codeOf = (fn) => {
  try {
    fn();
    return null;
  } catch (error) {
    return error.extensions.code;
  }
};

test("five free failures, then doubling waits, then a lock", () => {
  const c = clock();
  const th = createLoginThrottle({ now: c.now });
  for (let i = 0; i < 5; i++) {
    assert.strictEqual(codeOf(() => th.check("a@x.test", "1.1.1.1")), null, `attempt ${i + 1}`);
    th.fail("a@x.test", "1.1.1.1");
  }
  assert.strictEqual(codeOf(() => th.check("a@x.test", "1.1.1.1")), "TOO_MANY_ATTEMPTS", "6th must wait 1s");
  c.advance(1000);
  assert.strictEqual(codeOf(() => th.check("a@x.test", "1.1.1.1")), null);
  th.fail("a@x.test", "1.1.1.1");
  c.advance(1000);
  assert.strictEqual(codeOf(() => th.check("a@x.test", "1.1.1.1")), "TOO_MANY_ATTEMPTS", "7th must wait 2s");
  c.advance(1000);
  assert.strictEqual(codeOf(() => th.check("a@x.test", "1.1.1.1")), null);

  for (let i = 0; i < 4; i++) {
    th.fail("a@x.test", "1.1.1.1");
    c.advance(60 * 1000);
  }
  // 10 failures: locked for 15 minutes, with the wait in the message
  let error;
  try {
    th.check("a@x.test", "1.1.1.1");
  } catch (e) {
    error = e;
  }
  assert.match(error.message, /Try again in \d+ minutes/);
  c.advance(15 * 60 * 1000);
  assert.strictEqual(codeOf(() => th.check("a@x.test", "1.1.1.1")), null, "the lock and old failures expire");
});

test("other IPs and other accounts aren't slowed by one attacker; email case doesn't matter", () => {
  const c = clock();
  const th = createLoginThrottle({ now: c.now });
  for (let i = 0; i < 10; i++) th.fail("Victim@x.test", "6.6.6.6");
  assert.strictEqual(codeOf(() => th.check("victim@x.test", "6.6.6.6")), "TOO_MANY_ATTEMPTS");
  assert.strictEqual(codeOf(() => th.check("victim@x.test", "2.2.2.2")), null, "the real owner elsewhere can still log in");
  assert.strictEqual(codeOf(() => th.check("other@x.test", "6.6.6.6")), null);
});

test("guessing spread across many IPs locks the account for everyone", () => {
  const c = clock();
  const th = createLoginThrottle({ now: c.now });
  for (let i = 0; i < 30; i++) th.fail("target@x.test", `10.0.0.${i}`);
  assert.strictEqual(codeOf(() => th.check("target@x.test", "10.0.1.1")), "TOO_MANY_ATTEMPTS");
});

test("a successful login clears that IP's count; idle entries are swept", () => {
  const c = clock();
  const th = createLoginThrottle({ now: c.now });
  for (let i = 0; i < 5; i++) th.fail("a@x.test", "1.1.1.1");
  th.succeed("a@x.test", "1.1.1.1");
  assert.strictEqual(codeOf(() => th.check("a@x.test", "1.1.1.1")), null);
  c.advance(16 * 60 * 1000);
  th.sweep();
  assert.strictEqual(th.size(), 0);
});

let t;
before(async () => {
  t = await startTestServer();
});
after(() => t.stop());
beforeEach(() => t.reset());

const LOGIN = `mutation($e: String!, $p: String!) { login(email: $e, password: $p) { token } }`;
const code = (res) => res.errors && res.errors[0].extensions.code;

test("login: repeated wrong passwords get TOO_MANY_ATTEMPTS, same for unknown emails", async () => {
  await createUser({ email: "real@example.test", password: "password123" });
  for (const email of ["real@example.test", "nobody@example.test"]) {
    for (let i = 0; i < 5; i++) assert.strictEqual(code(await t.gql(LOGIN, { e: email, p: "wrong-guess" })), "UNAUTHENTICATED");
    const blocked = await t.gql(LOGIN, { e: email, p: "wrong-guess" });
    assert.strictEqual(code(blocked), "TOO_MANY_ATTEMPTS", email);
    assert.match(blocked.errors[0].message, /^Too many login attempts\. Try again in/);
  }
  // Even the right password waits during the backoff
  assert.strictEqual(code(await t.gql(LOGIN, { e: "real@example.test", p: "password123" })), "TOO_MANY_ATTEMPTS");
});
