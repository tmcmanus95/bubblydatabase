// End-to-end: backup.sh → restore.sh → verifyCounts against a throwaway local mongod with fake data,
// using real mongodump/mongorestore/age and a test key generated on the fly. Skips if those tools
// aren't installed. Run: node --test scripts/test/restore.test.js (needs `npm ci` in server/)
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const repoRoot = path.join(__dirname, "..", "..");
const has = (bin) => spawnSync("sh", ["-c", `command -v ${bin}`]).status === 0;
const toolsMissing = ["mongod", "mongodump", "mongorestore", "age", "age-keygen"].filter((b) => !has(b));
const skip = toolsMissing.length ? `missing: ${toolsMissing.join(", ")}` : false;

let tmp, mongod, port, keyFile, publicKey, backupFile;

const bash = (script, args, env) =>
  spawnSync("/bin/bash", [path.join(repoRoot, "scripts", script), ...args], {
    encoding: "utf8",
    env: { ...process.env, ...env },
    timeout: 60000,
  });

const connectWithRetry = async (mongoose, uri) => {
  for (let i = 0; i < 50; i++) {
    try {
      return await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 500 }).asPromise();
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  throw new Error("mongod did not start");
};

before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "restore-test-"));
  if (skip) return;
  port = 27100 + Math.floor(Math.random() * 800);
  fs.mkdirSync(path.join(tmp, "db"));
  mongod = spawn("mongod", ["--dbpath", path.join(tmp, "db"), "--port", String(port), "--bind_ip", "127.0.0.1", "--quiet"], { stdio: "ignore" });

  keyFile = path.join(tmp, "test.key");
  spawnSync("age-keygen", ["-o", keyFile]);
  publicKey = spawnSync("age-keygen", ["-y", keyFile], { encoding: "utf8" }).stdout.trim();

  // Fake "production" data in a local database named like prod
  const mongoose = require(path.join(repoRoot, "server/node_modules/mongoose"));
  const conn = await connectWithRetry(mongoose, `mongodb://127.0.0.1:${port}/bubblydatabase3`);
  const db = conn.db;
  await db.collection("users").insertMany(Array.from({ length: 45 }, (_, i) => ({ username: `u${i}`, email: `u${i}@example.test` })));
  await db.collection("bubblywaters").insertMany(Array.from({ length: 442 }, (_, i) => ({ productName: `p${i}`, brandName: "b" })));
  await db.collection("ratings").insertMany(Array.from({ length: 1350 }, (_, i) => ({ rating: (i % 10) / 2 + 0.5 })));
  await db.collection("ratings").createIndex({ bubblyWater: 1 });
  await conn.close();

  const out = path.join(tmp, "out");
  fs.mkdirSync(out);
  const r = bash("backup.sh", ["--local-only", out], {
    BACKUP_MONGODB_URI: `mongodb://127.0.0.1:${port}/bubblydatabase3`,
    AGE_PUBLIC_KEY: publicKey,
    MIN_BACKUP_BYTES: "1000", // fake data compresses far below the real-data minimum
  });
  assert.strictEqual(r.status, 0, r.stderr);
  backupFile = path.join(out, fs.readdirSync(out)[0]);
});

after(() => {
  if (mongod) mongod.kill();
  fs.rmSync(tmp, { recursive: true, force: true });
});

const restoreEnv = () => ({
  AGE_IDENTITY_FILE: keyFile,
  RESTORE_MONGODB_URI: `mongodb://127.0.0.1:${port}`,
});

test("restores a backup into a scratch database and the counts match", { skip }, () => {
  const r = bash("restore.sh", [backupFile, "bubblydatabase3_restoretest"], restoreEnv());
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /users\s+45/);
  assert.match(r.stdout, /bubblywaters\s+442/);
  assert.match(r.stdout, /ratings\s+1350\s+indexes: _id_, bubblyWater_1/);
  assert.match(r.stdout, /OK: counts match/);
});

test("restoring again replaces the data instead of duplicating it", { skip }, () => {
  const r = bash("restore.sh", [backupFile, "bubblydatabase3_restoretest"], restoreEnv());
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /ratings\s+1350/);
});

test("the wrong key fails without restoring", { skip }, () => {
  const otherKey = path.join(tmp, "other.key");
  spawnSync("age-keygen", ["-o", otherKey]);
  const r = bash("restore.sh", [backupFile, "bubblydatabase3_wrongkey"], { ...restoreEnv(), AGE_IDENTITY_FILE: otherKey });
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /failed/);
});

test("refuses the production database name and remote non-staging targets", () => {
  const key = path.join(tmp, "dummy.key");
  fs.writeFileSync(key, "AGE-SECRET-KEY-1DUMMY\n");
  const env = { AGE_IDENTITY_FILE: key, RESTORE_MONGODB_URI: "mongodb+srv://u:s3cret@cluster0.example.invalid/?retryWrites=true" };

  let r = bash("restore.sh", ["whatever.age", "bubblydatabase3"], env);
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /production database name/);

  r = bash("restore.sh", ["whatever.age", "scratch"], env);
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /Refusing to run/);
  assert.doesNotMatch(r.stdout + r.stderr, /s3cret/);

  r = bash("restore.sh", ["whatever.age", "bad;name"], env);
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /letters, digits/);
});

test('"latest" downloads the newest backup from R2 and restores it', { skip }, () => {
  // Fake aws: lists the test backup as the newest object and streams it on "s3 cp"
  const binDir = path.join(tmp, "fakebin");
  fs.mkdirSync(binDir, { recursive: true });
  const key = path.basename(backupFile);
  fs.writeFileSync(
    path.join(binDir, "aws"),
    `#!/bin/sh
echo "aws $*" >> "${tmp}/aws.log"
case "$1 $2" in
  "s3api list-objects-v2") echo "${key}" ;;
  "s3 cp") cat "${backupFile}" ;;
  *) exit 1 ;;
esac
`
  );
  fs.chmodSync(path.join(binDir, "aws"), 0o755);
  const r = bash("restore.sh", ["latest", "bubblydatabase3_fromr2"], {
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
  const calls = fs.readFileSync(path.join(tmp, "aws.log"), "utf8");
  assert.match(calls, /s3api list-objects-v2 --bucket bubbly-backups --endpoint-url https:\/\/example\.invalid/);
  assert.match(calls, new RegExp(`s3 cp s3://bubbly-backups/${key} - --endpoint-url`));
});
