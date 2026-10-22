// End-to-end: a backup of fake "production" data refreshed into a local bubblydatabase3_staging with
// scripts/staging-refresh.sh, using real tools on a throwaway mongod. Skips if the tools are missing.
// Run: node --test scripts/test/staging-refresh.test.js (needs `npm ci` in server/)
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const { skipWithoutTools: skip, runScript, connect, setupFakeProdBackup } = require("./helpers");

let env;

before(async () => {
  if (!skip) env = await setupFakeProdBackup();
});

after(() => {
  if (env) env.cleanup();
});

const stagingUri = () => `${env.serverUri}/bubblydatabase3_staging`;
const refresh = (args, extraEnv = {}) =>
  runScript("staging-refresh.sh", args, { MONGODB_URI: stagingUri(), AGE_IDENTITY_FILE: env.keyFile, ...extraEnv });

test("replaces stale staging data with the backup and scrubs emails", { skip }, async () => {
  // Stale staging data that should disappear
  const conn = await connect(stagingUri());
  await conn.db.collection("users").insertMany([{ username: "stale1" }, { username: "stale2" }]);
  await conn.close();

  const r = refresh([env.backupFile]);
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /OK: counts match/);
  assert.match(r.stdout, /Scrubbed 45 user emails in "bubblydatabase3_staging"/);

  const check = await connect(stagingUri());
  const users = check.db.collection("users");
  assert.strictEqual(await users.countDocuments(), 45);
  assert.strictEqual(await users.countDocuments({ username: /^stale/ }), 0);
  assert.strictEqual(await users.countDocuments({ email: /@realmail\.test$/ }), 0);
  const first = await users.findOne({ username: "u0" });
  assert.strictEqual(first.email, `user+${first._id}@example.test`);
  assert.strictEqual(first.passwordResetToken, null);
  assert.strictEqual(first.password, "$2b$10$fakehash", "passwords must be untouched");
  await check.close();
});

test("--keep-emails restores without scrubbing", { skip }, async () => {
  const r = refresh(["--keep-emails", env.backupFile]);
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stderr, /real user emails/);
  const check = await connect(stagingUri());
  assert.strictEqual(await check.db.collection("users").countDocuments({ email: /@realmail\.test$/ }), 45);
  await check.close();
});

test("refuses when MONGODB_URI names any database other than staging", () => {
  for (const uri of [
    "mongodb://127.0.0.1:27017/bubblydatabase3",
    "mongodb://127.0.0.1:27017/bubblydatabase3_restoretest",
    "mongodb+srv://u:s3cret@cluster0.example.invalid/bubblydatabase3?retryWrites=true",
    "mongodb+srv://u:s3cret@cluster0.example.invalid/",
  ]) {
    const r = runScript("staging-refresh.sh", ["whatever.age"], { MONGODB_URI: uri, AGE_IDENTITY_FILE: "/dev/null" });
    assert.notStrictEqual(r.status, 0, uri);
    assert.match(r.stderr, /only ever targets "bubblydatabase3_staging"|must name a database/, uri);
    assert.doesNotMatch(r.stdout + r.stderr, /s3cret/);
  }
});

test("rejects unknown options", () => {
  const r = runScript("staging-refresh.sh", ["--scrub"], { MONGODB_URI: "mongodb://127.0.0.1/bubblydatabase3_staging" });
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /unknown option: --scrub/);
});
