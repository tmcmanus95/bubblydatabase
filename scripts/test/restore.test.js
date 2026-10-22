// End-to-end: backup.sh → restore.sh → verifyCounts against a throwaway local mongod with fake data,
// using real mongodump/mongorestore/age and a test key generated on the fly. Skips if those tools
// aren't installed. Run: node --test scripts/test/restore.test.js (needs `npm ci` in server/)
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { skipWithoutTools: skip, runScript, setupFakeProdBackup } = require("./helpers");

let env;

before(async () => {
  if (!skip) env = await setupFakeProdBackup();
});

after(() => {
  if (env) env.cleanup();
});

const restoreEnv = () => ({
  AGE_IDENTITY_FILE: env.keyFile,
  RESTORE_MONGODB_URI: env.serverUri,
});

test("restores a backup into a scratch database and the counts match", { skip }, () => {
  const r = runScript("restore.sh", [env.backupFile, "bubblydatabase3_restoretest"], restoreEnv());
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /users\s+45/);
  assert.match(r.stdout, /bubblywaters\s+442/);
  assert.match(r.stdout, /ratings\s+1350\s+indexes: _id_, bubblyWater_1/);
  assert.match(r.stdout, /OK: counts match/);
});

test("restoring again replaces the data instead of duplicating it", { skip }, () => {
  const r = runScript("restore.sh", [env.backupFile, "bubblydatabase3_restoretest"], restoreEnv());
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /ratings\s+1350/);
});

test("the wrong key fails without restoring", { skip }, () => {
  const otherKey = path.join(env.tmp, "other.key");
  spawnSync("age-keygen", ["-o", otherKey]);
  const r = runScript("restore.sh", [env.backupFile, "bubblydatabase3_wrongkey"], { ...restoreEnv(), AGE_IDENTITY_FILE: otherKey });
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /failed/);
});

test('"latest" downloads the newest backup from R2 and restores it', { skip }, () => {
  // Fake aws: lists the test backup as the newest object and streams it on "s3 cp"
  const binDir = path.join(env.tmp, "fakebin");
  fs.mkdirSync(binDir, { recursive: true });
  const key = path.basename(env.backupFile);
  fs.writeFileSync(
    path.join(binDir, "aws"),
    `#!/bin/sh
echo "aws $*" >> "${env.tmp}/aws.log"
case "$1 $2" in
  "s3api list-objects-v2") echo "${key}" ;;
  "s3 cp") cat "${env.backupFile}" ;;
  *) exit 1 ;;
esac
`
  );
  fs.chmodSync(path.join(binDir, "aws"), 0o755);
  const r = runScript("restore.sh", ["latest", "bubblydatabase3_fromr2"], {
    ...restoreEnv(),
    PATH: `${binDir}:${process.env.PATH}`,
    R2_ENDPOINT: "https://example.invalid",
    R2_BUCKET: "bubbly-backups",
    AWS_ACCESS_KEY_ID: "id",
    AWS_SECRET_ACCESS_KEY: "key",
  });
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stderr, new RegExp(`s3://bubbly-backups/${key}`));
  assert.match(r.stdout, /OK: counts match/);
  const calls = fs.readFileSync(path.join(env.tmp, "aws.log"), "utf8");
  assert.match(calls, /s3api list-objects-v2 --bucket bubbly-backups --endpoint-url https:\/\/example\.invalid/);
  assert.match(calls, new RegExp(`s3 cp s3://bubbly-backups/${key} - --endpoint-url`));
});

test("refuses the production database name and remote non-staging targets", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "restore-refuse-"));
  const key = path.join(tmp, "dummy.key");
  fs.writeFileSync(key, "AGE-SECRET-KEY-1DUMMY\n");
  const refuseEnv = { AGE_IDENTITY_FILE: key, RESTORE_MONGODB_URI: "mongodb+srv://u:s3cret@cluster0.example.invalid/?retryWrites=true" };

  let r = runScript("restore.sh", ["whatever.age", "bubblydatabase3"], refuseEnv);
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /production database name/);

  r = runScript("restore.sh", ["whatever.age", "scratch"], refuseEnv);
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /Refusing to run/);
  assert.doesNotMatch(r.stdout + r.stderr, /s3cret/);

  r = runScript("restore.sh", ["whatever.age", "bad;name"], refuseEnv);
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /letters, digits/);
  fs.rmSync(tmp, { recursive: true, force: true });
});
