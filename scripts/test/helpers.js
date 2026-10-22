// Shared setup for the backup/restore end-to-end tests: a throwaway local mongod, a fresh age test
// key, fake "production" data in a local database named bubblydatabase3, and a backup of it.
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const repoRoot = path.join(__dirname, "..", "..");

const has = (bin) => spawnSync("sh", ["-c", `command -v ${bin}`]).status === 0;
const missing = ["mongod", "mongodump", "mongorestore", "age", "age-keygen"].filter((b) => !has(b));
// Pass as the `skip` option of tests that need the real tools
const skipWithoutTools = missing.length ? `missing: ${missing.join(", ")}` : false;

const runScript = (script, args, env) =>
  spawnSync("/bin/bash", [path.join(repoRoot, "scripts", script), ...args], {
    encoding: "utf8",
    env: { ...process.env, ...env },
    timeout: 60000,
  });

const mongoose = () => require(path.join(repoRoot, "server/node_modules/mongoose"));

const connect = async (uri) => {
  for (let i = 0; i < 50; i++) {
    try {
      return await mongoose().createConnection(uri, { serverSelectionTimeoutMS: 500 }).asPromise();
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  throw new Error("mongod did not start");
};

// Starts mongod, seeds fake prod data, writes an encrypted backup. Call cleanup() when done.
const setupFakeProdBackup = async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "backup-e2e-"));
  const port = 27100 + Math.floor(Math.random() * 800);
  fs.mkdirSync(path.join(tmp, "db"));
  const mongod = spawn(
    "mongod",
    ["--dbpath", path.join(tmp, "db"), "--port", String(port), "--bind_ip", "127.0.0.1", "--quiet"],
    { stdio: "ignore" }
  );
  const cleanup = () => {
    mongod.kill();
    fs.rmSync(tmp, { recursive: true, force: true });
  };

  try {
    const keyFile = path.join(tmp, "test.key");
    spawnSync("age-keygen", ["-o", keyFile]);
    const publicKey = spawnSync("age-keygen", ["-y", keyFile], { encoding: "utf8" }).stdout.trim();

    const serverUri = `mongodb://127.0.0.1:${port}`;
    const conn = await connect(`${serverUri}/bubblydatabase3`);
    const db = conn.db;
    await db.collection("users").insertMany(
      Array.from({ length: 45 }, (_, i) => ({
        username: `u${i}`,
        email: `person${i}@realmail.test`,
        password: "$2b$10$fakehash",
        passwordResetToken: i === 0 ? "abc123" : null,
      }))
    );
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("bubblywaters").insertMany(Array.from({ length: 442 }, (_, i) => ({ productName: `p${i}`, brandName: "b" })));
    await db.collection("ratings").insertMany(Array.from({ length: 1350 }, (_, i) => ({ rating: (i % 10) / 2 + 0.5 })));
    await db.collection("ratings").createIndex({ bubblyWater: 1 });
    await conn.close();

    const out = path.join(tmp, "out");
    fs.mkdirSync(out);
    const r = runScript("backup.sh", ["--local-only", out], {
      BACKUP_MONGODB_URI: `${serverUri}/bubblydatabase3`,
      AGE_PUBLIC_KEY: publicKey,
      MIN_BACKUP_BYTES: "1000", // fake data compresses far below the real-data minimum
    });
    assert.strictEqual(r.status, 0, r.stderr);
    const backupFile = path.join(out, fs.readdirSync(out)[0]);

    return { tmp, port, serverUri, keyFile, backupFile, cleanup };
  } catch (err) {
    cleanup();
    throw err;
  }
};

module.exports = { repoRoot, skipWithoutTools, runScript, connect, setupFakeProdBackup };
