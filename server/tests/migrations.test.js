// P1-11: the migration runner (scripts/lib/migrations.js) against the in-memory database, and the CLI's
// production guard.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const mongoose = require("mongoose");
const { startTestServer } = require("./helpers");
const migrations = require("../scripts/lib/migrations");

let t;
let dir;
const quiet = () => {};

const write = (file, body) => fs.writeFileSync(path.join(dir, file), body);

before(async () => {
  t = await startTestServer();
});
after(() => t.stop());
beforeEach(async () => {
  await t.reset();
  // Test servers apply the repo's migrations; these tests use their own folder
  await mongoose.connection.db.collection(migrations.CHANGELOG).deleteMany({});
  await mongoose.connection.db.collection("widgets").deleteMany({});
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "migrations-"));
  write(
    "202601010000-add-widgets.js",
    `module.exports = {
      description: "add widgets",
      up: async (db) => { await db.collection("widgets").insertOne({ _id: "w1" }); },
      down: async (db) => { await db.collection("widgets").deleteOne({ _id: "w1" }); },
    };`
  );
  write(
    "202601020000-index-widgets.js",
    `module.exports = {
      description: "index widgets",
      up: async (db) => { await db.collection("widgets").createIndex({ name: 1 }, { name: "name_1" }); },
      down: async (db) => { await db.collection("widgets").dropIndex("name_1"); },
    };`
  );
});

const db = () => mongoose.connection.db;

test("up applies pending migrations in order, once; status shows them", async () => {
  assert.deepStrictEqual(await migrations.up(db(), dir, quiet), ["202601010000-add-widgets", "202601020000-index-widgets"]);
  assert.deepStrictEqual(await migrations.up(db(), dir, quiet), [], "nothing runs twice");
  assert.strictEqual(await db().collection("widgets").countDocuments(), 1);
  const indexes = (await db().collection("widgets").indexes()).map((i) => i.name);
  assert.ok(indexes.includes("name_1"));
  assert.deepStrictEqual((await migrations.status(db(), dir)).map((m) => m.applied), [true, true]);
});

test("down reverts only the most recent migration, and up re-applies it", async () => {
  await migrations.up(db(), dir, quiet);
  assert.strictEqual(await migrations.down(db(), dir, quiet), "202601020000-index-widgets");
  assert.ok(!(await db().collection("widgets").indexes()).some((i) => i.name === "name_1"));
  assert.strictEqual(await db().collection("widgets").countDocuments(), 1, "the earlier migration stays");
  assert.deepStrictEqual(await migrations.up(db(), dir, quiet), ["202601020000-index-widgets"]);
  await migrations.down(db(), dir, quiet);
  await migrations.down(db(), dir, quiet);
  assert.strictEqual(await migrations.down(db(), dir, quiet), null, "nothing left to revert");
  assert.strictEqual(await db().collection("widgets").countDocuments(), 0);
});

test("a failing migration stops the run and isn't recorded", async () => {
  write("202601030000-broken.js", `module.exports = { up: async () => { throw new Error("boom"); }, down: async () => {} };`);
  await assert.rejects(migrations.up(db(), dir, quiet), /boom/);
  const applied = (await migrations.status(db(), dir)).filter((m) => m.applied).map((m) => m.id);
  assert.deepStrictEqual(applied, ["202601010000-add-widgets", "202601020000-index-widgets"]);
});

test("badly named or incomplete migration files are refused", () => {
  write("add-thing.js", "module.exports = { up() {}, down() {} };");
  assert.throws(() => migrations.loadMigrations(dir), /must look like/);
  fs.unlinkSync(path.join(dir, "add-thing.js"));
  write("202601040000-no-down.js", "module.exports = { up() {} };");
  assert.throws(() => migrations.loadMigrations(dir), /must export up\(db\) and down\(db\)/);
});

test("the repo's own migrations load, and each has a description", () => {
  for (const m of migrations.loadMigrations()) assert.ok(m.description, `${m.id} needs a description`);
});

test("the CLI refuses the production database before connecting", () => {
  const result = spawnSync(process.execPath, [path.join(__dirname, "../scripts/migrate.js"), "status"], {
    env: { ...process.env, MONGODB_URI: "mongodb+srv://user:secret@cluster0.example.net/bubblydatabase3" },
    encoding: "utf8",
    timeout: 20000,
  });
  assert.strictEqual(result.status, 1);
  assert.match(result.stderr, /Refusing to run/);
  assert.doesNotMatch(result.stderr + result.stdout, /secret/, "credentials never printed");
});
