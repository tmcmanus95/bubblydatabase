// P2-1: every admin offer change lands in the audit log with before/after; only admins can read it.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const { startTestServer } = require("./helpers");
const { createUser, createBubbly } = require("./fixtures");

let t;
before(async () => {
  t = await startTestServer();
});
after(() => t.stop());
beforeEach(() => t.reset());

const ADD = `mutation($b: ID!, $o: OfferInput!) { addOffer(bubblyWaterId: $b, offer: $o) { _id } }`;
const EDIT = `mutation($b: ID!, $id: ID!, $o: OfferInput!) { editOffer(bubblyWaterId: $b, offerId: $id, offer: $o) { _id } }`;
const ACTIVE = `mutation($b: ID!, $id: ID!, $a: Boolean!) { setOfferActive(bubblyWaterId: $b, offerId: $id, active: $a) { _id } }`;
const LOG = `query($id: ID) { adminEdits(targetId: $id) { action targetType targetId before after admin { username } } }`;

test("offer add, edit and deactivate are logged with who, what, before and after", async () => {
  const admin = await createUser({ role: "admin", username: "boss" });
  const b = String((await createBubbly())._id);
  const added = await t.gql(ADD, { b, o: { retailer: "Shop", network: "direct", url: "https://shop.example/1" } }, admin);
  const offerId = added.data.addOffer[0]._id;
  await t.gql(EDIT, { b, id: offerId, o: { retailer: "Shop", network: "direct", url: "https://shop.example/2" } }, admin);
  await t.gql(ACTIVE, { b, id: offerId, a: false }, admin);

  const res = await t.gql(LOG, { id: b }, admin);
  assert.ifError(res.errors);
  const log = res.data.adminEdits;
  assert.deepStrictEqual(log.map((e) => e.action), ["offer.deactivate", "offer.edit", "offer.add"], "newest first");
  assert.ok(log.every((e) => e.admin.username === "boss" && e.targetType === "product" && e.targetId === b));
  const edit = log[1];
  assert.strictEqual(JSON.parse(edit.before).url, "https://shop.example/1");
  assert.strictEqual(JSON.parse(edit.after).url, "https://shop.example/2");
  assert.strictEqual(JSON.parse(log[2].after).retailer, "Shop");
});

test("only admins can read the log", async () => {
  const user = await createUser();
  assert.strictEqual((await t.gql(LOG, {}, user)).errors[0].extensions.code, "FORBIDDEN");
  assert.strictEqual((await t.gql(LOG, {})).errors[0].extensions.code, "UNAUTHENTICATED");
});

test("the audit-log migration is reversible", async () => {
  const migration = require("../../migrations/202610240007-create-admin-edits");
  const db = mongoose.connection.db;
  await migration.down(db);
  assert.strictEqual(await db.listCollections({ name: "adminedits" }).hasNext(), false);
  await migration.up(db);
  await migration.up(db);
  assert.ok((await db.collection("adminedits").indexes()).some((i) => i.name === "targetId_1_at_-1"));
});
