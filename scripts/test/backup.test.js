// Tests scripts/backup.sh against fake mongodump / age / aws binaries, so no database, network or
// real keys are needed. Run: node --test scripts/test/backup.test.js
const { test, beforeEach } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const script = path.join(__dirname, "..", "backup.sh");
const SECRET = "s3cretpass";
const URI = `mongodb+srv://backup-ro:${SECRET}@cluster0.example.invalid/bubblydatabase3?retryWrites=true`;
const AGE_KEY = "age1testrecipientxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

let tmp, binDir, outDir, log;

const writeBin = (name, body) => {
  const file = path.join(binDir, name);
  fs.writeFileSync(file, `#!/bin/sh\n${body}\n`);
  fs.chmodSync(file, 0o755);
};

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "backup-test-"));
  binDir = path.join(tmp, "bin");
  outDir = path.join(tmp, "out");
  log = path.join(tmp, "calls.log");
  fs.mkdirSync(binDir);
  fs.mkdirSync(outDir);
  // mongodump: records its args; prints a big fake archive, or fails echoing the URI like a real error might
  writeBin(
    "mongodump",
    `echo "mongodump $*" >> "${log}"
if [ -n "$FAKE_DUMP_FAIL" ]; then echo "error connecting to $1" >&2; exit 1; fi
if [ -n "$FAKE_DUMP_EMPTY" ]; then exit 0; fi
head -c 20000 /dev/zero`
  );
  // age: checks for -r, writes a real-looking header then the input
  writeBin(
    "age",
    `echo "age $1 $2" >> "${log}"
[ "$1" = "-r" ] || exit 2
printf 'age-encryption.org/v1\\n'
cat`
  );
  // aws: records calls; head-object fails when FAKE_HEAD_FAIL is set
  writeBin(
    "aws",
    `echo "aws $*" >> "${log}"
if [ "$2" = "head-object" ] && [ -n "$FAKE_HEAD_FAIL" ]; then exit 255; fi
exit 0`
  );
});

const run = (args = [], env = {}) => {
  const result = spawnSync("/bin/bash", [script, ...args], {
    encoding: "utf8",
    env: {
      PATH: `${binDir}:/usr/bin:/bin`,
      BACKUP_MONGODB_URI: URI,
      AGE_PUBLIC_KEY: AGE_KEY,
      R2_ENDPOINT: "https://example.invalid",
      R2_BUCKET: "bubbly-backups",
      AWS_ACCESS_KEY_ID: "id",
      AWS_SECRET_ACCESS_KEY: "key",
      ...env,
    },
  });
  const calls = fs.existsSync(log) ? fs.readFileSync(log, "utf8") : "";
  const output = result.stdout + result.stderr;
  assert.doesNotMatch(output, new RegExp(SECRET), "credentials leaked into output");
  return { ...result, calls, output };
};

test("--local-only writes an encrypted file named after the database and skips upload", () => {
  const r = run(["--local-only", outDir]);
  assert.strictEqual(r.status, 0, r.output);
  const files = fs.readdirSync(outDir);
  assert.strictEqual(files.length, 1);
  assert.match(files[0], /^bubblydatabase3-\d{4}-\d{2}-\d{2}T\d{4}Z\.archive\.gz\.age$/);
  assert.match(fs.readFileSync(path.join(outDir, files[0]), "utf8"), /^age-encryption\.org\/v1/);
  assert.match(r.calls, /mongodump --uri=\S+ --archive --gzip/);
  assert.match(r.calls, new RegExp(`age -r ${AGE_KEY}`));
  assert.doesNotMatch(r.calls, /^aws/m);
});

test("upload mode copies to R2, verifies it, and leaves no local file", () => {
  const r = run([], { TMPDIR: tmp + "/" });
  assert.strictEqual(r.status, 0, r.output);
  assert.match(r.calls, /aws s3 cp \S+ s3:\/\/bubbly-backups\/bubblydatabase3-\S+\.archive\.gz\.age --endpoint-url https:\/\/example\.invalid/);
  assert.match(r.calls, /aws s3api head-object --bucket bubbly-backups --key bubblydatabase3-/);
  const leftovers = fs.readdirSync(tmp).filter((f) => f.startsWith("tmp."));
  assert.deepStrictEqual(leftovers, []);
});

test("BACKUP_PREFIX overrides the file name prefix", () => {
  const r = run(["--local-only", outDir], { BACKUP_PREFIX: "staging-dryrun" });
  assert.strictEqual(r.status, 0, r.output);
  assert.match(fs.readdirSync(outDir)[0], /^staging-dryrun-/);
});

test("a failed dump exits non-zero, keeps nothing, uploads nothing, and redacts the URI", () => {
  const r = run(["--local-only", outDir], { FAKE_DUMP_FAIL: "1" });
  assert.notStrictEqual(r.status, 0);
  assert.match(r.output, /<redacted>@cluster0\.example\.invalid/);
  assert.deepStrictEqual(fs.readdirSync(outDir), []);
  const up = run([], { FAKE_DUMP_FAIL: "1" });
  assert.notStrictEqual(up.status, 0);
  assert.doesNotMatch(up.calls, /^aws/m);
});

test("a suspiciously small backup is rejected", () => {
  const r = run(["--local-only", outDir], { FAKE_DUMP_EMPTY: "1" });
  assert.notStrictEqual(r.status, 0);
  assert.match(r.output, /only \d+ bytes/);
  assert.deepStrictEqual(fs.readdirSync(outDir), []);
});

test("an unverifiable upload fails", () => {
  const r = run([], { FAKE_HEAD_FAIL: "1" });
  assert.notStrictEqual(r.status, 0);
  assert.match(r.output, /could not be verified/);
});

test("refuses missing or malformed configuration", () => {
  const cases = [
    [{ BACKUP_MONGODB_URI: "" }, /BACKUP_MONGODB_URI is not set/],
    [{ BACKUP_MONGODB_URI: "mongodb+srv://u:p@cluster0.example.invalid/" }, /must include a database name/],
    [{ AGE_PUBLIC_KEY: "" }, /AGE_PUBLIC_KEY is not set/],
    [{ AGE_PUBLIC_KEY: "AGE-SECRET-KEY-1XYZ" }, /doesn't look like an age public key/],
    [{ R2_BUCKET: "" }, /R2_BUCKET is not set/],
  ];
  for (const [env, message] of cases) {
    const r = run([], env);
    assert.notStrictEqual(r.status, 0, JSON.stringify(env));
    assert.match(r.output, message);
    assert.doesNotMatch(r.calls, /mongodump/, "must fail before dumping");
  }
});
