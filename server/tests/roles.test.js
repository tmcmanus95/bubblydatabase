// P1-7: roles. The migration, role-based admin checks, the env fallback, and the setRole script's guard.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const path = require("path");
const { spawnSync } = require("child_process");
const mongoose = require("mongoose");
const { startTestServer } = require("./helpers");
const { createUser } = require("./fixtures");
const { User } = require("../models");
const { requireAdmin, requireSelfOrAdmin } = require("../utils/auth");

let t;
before(async () => {
  t = await startTestServer();
});
after(() => t.stop());
beforeEach(() => t.reset());

const USERS = `{ users { username } }`;
const code = (res) => res.errors && res.errors[0].extensions.code;
const rejects = async (promise, expected) => {
  try {
    await promise;
    return false;
  } catch (error) {
    return error.extensions.code === expected;
  }
};

test("the roles migration gives existing accounts role user, and down removes only what it added", async () => {
  const migration = require("../../migrations/202610240001-add-user-roles");
  const users = mongoose.connection.db.collection("users");
  await users.insertMany([{ username: "old1", email: "old1@example.test" }, { username: "old2", email: "old2@example.test", role: "admin" }]);
  await migration.up(mongoose.connection.db);
  assert.strictEqual((await users.findOne({ username: "old1" })).role, "user");
  assert.strictEqual((await users.findOne({ username: "old2" })).role, "admin", "an existing role is kept");
  await migration.down(mongoose.connection.db);
  assert.strictEqual(await users.countDocuments({ role: { $exists: false } }), 1, "only the account it changed loses the role");
  assert.strictEqual((await users.findOne({ username: "old2" })).role, "admin", "a role it didn't add stays");
});

test("new accounts are users; only admins pass requireAdmin; owners and admins pass requireSelfOrAdmin", async () => {
  const user = await createUser();
  const admin = await createUser({ role: "admin" });
  assert.strictEqual(user.role, "user");
  const ctx = (u) => ({ user: { _id: String(u._id) } });

  assert.ok(await rejects(requireAdmin({}), "UNAUTHENTICATED"));
  assert.ok(await rejects(requireAdmin(ctx(user)), "FORBIDDEN"));
  await requireAdmin(ctx(admin));

  assert.ok(await rejects(requireSelfOrAdmin(ctx(user), admin._id), "FORBIDDEN"));
  assert.strictEqual(await requireSelfOrAdmin(ctx(user), user._id), String(user._id));
  await requireSelfOrAdmin(ctx(admin), user._id);
});

test("admin-only operations follow the role, and losing the role takes effect at once", async () => {
  const user = await createUser();
  const admin = await createUser({ role: "admin" });
  assert.strictEqual(code(await t.gql(USERS, {}, user)), "FORBIDDEN");
  assert.ifError((await t.gql(USERS, {}, admin)).errors);
  await User.updateOne({ _id: admin._id }, { $set: { role: "user" } });
  assert.strictEqual(code(await t.gql(USERS, {}, admin)), "FORBIDDEN");
});

test("the ADMIN_USER_IDS env var still grants admin during the rollout", async () => {
  const user = await createUser();
  process.env.ADMIN_USER_IDS = String(user._id);
  try {
    assert.ifError((await t.gql(USERS, {}, user)).errors);
  } finally {
    process.env.ADMIN_USER_IDS = "";
  }
});

test("role isn't readable through GraphQL", async () => {
  const user = await createUser();
  const res = await t.gql(`{ me { role } }`, {}, user);
  assert.match(res.errors[0].message, /Cannot query field "role"/);
});

test("setRole refuses the production database without the override, and never prints credentials", () => {
  const result = spawnSync(process.execPath, [path.join(__dirname, "../scripts/setRole.js"), "thomas@example.test", "admin"], {
    env: { ...process.env, MONGODB_URI: "mongodb+srv://user:secret@cluster0.example.net/bubblydatabase3" },
    encoding: "utf8",
    timeout: 20000,
  });
  assert.strictEqual(result.status, 1);
  assert.match(result.stderr, /Refusing to run/);
  assert.doesNotMatch(result.stderr + result.stdout, /secret/);
});
