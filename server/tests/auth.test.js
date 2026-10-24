// P0-10 smoke tests: signup, login, email verification, password reset, and private user data.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const { startTestServer } = require("./helpers");
const { createUser } = require("./fixtures");
const { User } = require("../models");

let t;

before(async () => {
  t = await startTestServer();
  await User.init(); // unique indexes on username/email
});
after(() => t.stop());
beforeEach(() => t.reset());

const SIGNUP = `mutation($u: String!, $e: String!, $p: String!) {
  addUser(username: $u, email: $e, password: $p) { token user { _id username isVerified } }
}`;
const LOGIN = `mutation($e: String!, $p: String!) { login(email: $e, password: $p) { token user { _id username } } }`;
const code = (res) => res.errors && res.errors[0].extensions && res.errors[0].extensions.code;

test("signup creates an unverified user, returns a token, and emails a verification link", async () => {
  const res = await t.gql(SIGNUP, { u: "fizzfan", e: "fizzfan@example.test", p: "bubbles123" });
  assert.ifError(res.errors);
  assert.ok(res.data.addUser.token);
  assert.strictEqual(res.data.addUser.user.isVerified, false);

  const user = await User.findOne({ username: "fizzfan" });
  assert.notStrictEqual(user.password, "bubbles123", "password must be hashed");
  assert.strictEqual(t.outbox.length, 1);
  assert.strictEqual(t.outbox[0].to, "fizzfan@example.test");
  assert.match(t.outbox[0].text, new RegExp(`/verifyEmail/${user.emailVerificationToken}`));
});

test("signup rejects a duplicate username or email", async () => {
  await createUser({ username: "taken", email: "taken@example.test" });
  let res = await t.gql(SIGNUP, { u: "taken", e: "new@example.test", p: "bubbles123" });
  assert.ok(res.errors);
  res = await t.gql(SIGNUP, { u: "newname", e: "taken@example.test", p: "bubbles123" });
  assert.ok(res.errors);
});

test("login works with the right password and fails with the wrong one or an unknown email", async () => {
  await createUser({ username: "loginme", email: "loginme@example.test", password: "rightpass" });

  let res = await t.gql(LOGIN, { e: "loginme@example.test", p: "rightpass" });
  assert.ifError(res.errors);
  assert.ok(res.data.login.token);

  res = await t.gql(LOGIN, { e: "loginme@example.test", p: "wrongpass" });
  assert.strictEqual(code(res), "UNAUTHENTICATED");
  res = await t.gql(LOGIN, { e: "nobody@example.test", p: "rightpass" });
  assert.strictEqual(code(res), "UNAUTHENTICATED");
});

test("the login token identifies the user", async () => {
  const user = await createUser();
  const res = await t.gql("{ meId { _id username } }", {}, user);
  assert.strictEqual(res.data.meId.username, user.username);
  assert.strictEqual(code(await t.gql("{ meId { _id } }")), "UNAUTHENTICATED");
});

test("verifying with the emailed token marks the user verified", async () => {
  const res = await t.gql(SIGNUP, { u: "verifyme", e: "verifyme@example.test", p: "bubbles123" });
  const userId = res.data.addUser.user._id;
  const token = t.outbox[0].text.match(/verifyEmail\/(\w+)/)[1];
  const VERIFY = `mutation($t: String!, $u: ID!) { verifyEmail(token: $t, userId: $u) { user { isVerified } } }`;

  const other = await createUser();
  assert.ok((await t.gql(VERIFY, { t: token, u: String(other._id) })).errors, "token must match the user");

  const ok = await t.gql(VERIFY, { t: token, u: userId });
  assert.ifError(ok.errors);
  assert.strictEqual(ok.data.verifyEmail.user.isVerified, true);
});

test("password reset: link works once, expires, and doesn't reveal unknown emails", async () => {
  await createUser({ email: "forgetful@example.test", password: "oldpass1" });
  const FORGOT = `mutation($e: String!) { forgotPassword(email: $e) }`;
  const RESET = `mutation($t: String!, $e: String!, $p: String!) { resetPassword(token: $t, email: $e, newPassword: $p) { user { username } } }`;

  const unknown = await t.gql(FORGOT, { e: "nobody@example.test" });
  assert.strictEqual(unknown.data.forgotPassword, true);
  assert.strictEqual(t.outbox.length, 0);

  assert.strictEqual((await t.gql(FORGOT, { e: "forgetful@example.test" })).data.forgotPassword, true);
  const token = t.outbox[0].text.match(/resetPassword\/(\w+)/)[1];

  assert.ok((await t.gql(RESET, { t: "wrong", e: "forgetful@example.test", p: "newpass1" })).errors);

  await User.updateOne({ email: "forgetful@example.test" }, { passwordResetExpires: new Date(Date.now() - 1000) });
  assert.ok((await t.gql(RESET, { t: token, e: "forgetful@example.test", p: "newpass1" })).errors, "expired token");

  await User.updateOne({ email: "forgetful@example.test" }, { passwordResetExpires: new Date(Date.now() + 60000) });
  assert.ifError((await t.gql(RESET, { t: token, e: "forgetful@example.test", p: "newpass1" })).errors);
  assert.ok((await t.gql(RESET, { t: token, e: "forgetful@example.test", p: "again123" })).errors, "token is single-use");

  assert.ifError((await t.gql(LOGIN, { e: "forgetful@example.test", p: "newpass1" })).errors);
});

test("resending verification works for unknown emails without revealing them", async () => {
  const RESEND = `mutation($e: String!) { resendEmailVerification(email: $e) }`;
  assert.strictEqual((await t.gql(RESEND, { e: "nobody@example.test" })).data.resendEmailVerification, true);
  assert.strictEqual(t.outbox.length, 0);
  await createUser({ email: "resend@example.test", isVerified: false });
  assert.strictEqual((await t.gql(RESEND, { e: "resend@example.test" })).data.resendEmailVerification, true);
  assert.strictEqual(t.outbox.length, 1);
});

test("private user data is never exposed", async () => {
  const alice = await createUser({ username: "alice", email: "alice@example.test" });
  const bob = await createUser();

  for (const field of ["password", "passwordResetToken", "emailVerificationToken", "passwordResetExpires"]) {
    const res = await t.gql(`{ searchUsers(username: "alice") { ${field} } }`);
    assert.match(res.errors[0].message, /Cannot query field/, field);
  }

  const asStranger = await t.gql(`{ searchUsers(username: "alice") { username email } }`, {}, bob);
  assert.deepStrictEqual(asStranger.data.searchUsers, { username: "alice", email: null });
  const anonymous = await t.gql(`{ searchUsers(username: "alice") { email } }`);
  assert.strictEqual(anonymous.data.searchUsers.email, null);
  const self = await t.gql(`{ meId { email } }`, {}, alice);
  assert.strictEqual(self.data.meId.email, "alice@example.test");
});

test("the users list is admin-only", async () => {
  const user = await createUser();
  const admin = await createUser();
  assert.strictEqual(code(await t.gql("{ users { username } }")), "UNAUTHENTICATED");
  assert.strictEqual(code(await t.gql("{ users { username } }", {}, user)), "FORBIDDEN");

  process.env.ADMIN_USER_IDS = String(admin._id);
  try {
    const res = await t.gql("{ users { username } }", {}, admin);
    assert.strictEqual(res.data.users.length, 2);
  } finally {
    process.env.ADMIN_USER_IDS = "";
  }
});

test("old cost-10 hashes still log in and are upgraded to cost 12; new passwords use 12", async () => {
  const bcrypt = require("bcrypt");
  const user = await createUser({ email: "legacy@example.test", password: "temporary1" });
  // Store a hash the way the old code did (cost 10), bypassing the save hook
  await User.updateOne({ _id: user._id }, { $set: { password: await bcrypt.hash("oldpassword", 10) } });

  const res = await t.gql(LOGIN, { e: "legacy@example.test", p: "oldpassword" });
  assert.ifError(res.errors);
  const upgraded = (await User.findById(user._id)).password;
  assert.strictEqual(bcrypt.getRounds(upgraded), 12);
  assert.ok(await bcrypt.compare("oldpassword", upgraded), "same password, stronger hash");

  // Logging in again still works and doesn't rehash
  assert.ifError((await t.gql(LOGIN, { e: "legacy@example.test", p: "oldpassword" })).errors);
  assert.strictEqual((await User.findById(user._id)).password, upgraded);

  // A wrong password never triggers an upgrade
  await User.updateOne({ _id: user._id }, { $set: { password: await bcrypt.hash("oldpassword", 10) } });
  await t.gql(LOGIN, { e: "legacy@example.test", p: "not-it" });
  assert.strictEqual(bcrypt.getRounds((await User.findById(user._id)).password), 10);

  const fresh = await createUser({ password: "brandnew99" });
  assert.strictEqual(bcrypt.getRounds(fresh.password), 12);
});
