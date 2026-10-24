// P15-2: only admins manage offers; the public sees active offers without links; isAdmin is self-only.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const { startTestServer } = require("./helpers");
const { createUser, createBubbly } = require("./fixtures");

let t;
before(async () => {
  t = await startTestServer();
});
after(() => t.stop());
beforeEach(() => t.reset());

const ADD = `mutation($b: ID!, $o: OfferInput!) { addOffer(bubblyWaterId: $b, offer: $o) { _id retailer network asin url active status } }`;
const EDIT = `mutation($b: ID!, $id: ID!, $o: OfferInput!) { editOffer(bubblyWaterId: $b, offerId: $id, offer: $o) { _id retailer url packSize status } }`;
const ACTIVE = `mutation($b: ID!, $id: ID!, $a: Boolean!) { setOfferActive(bubblyWaterId: $b, offerId: $id, active: $a) { _id active } }`;
const ADMIN_LIST = `query($b: ID!) { adminOffers(bubblyWaterId: $b) { _id retailer url } }`;
const PUBLIC = `query($b: ID) { bubblyWater(bubblyWaterId: $b) { offers { _id retailer packSize } } }`;
const code = (res) => res.errors && res.errors[0].extensions.code;

test("admins add, edit and deactivate offers; the public sees only active ones, without links", async () => {
  const admin = await createUser({ role: "admin" });
  const water = await createBubbly();
  const b = String(water._id);
  let res = await t.gql(ADD, { b, o: { retailer: "Amazon", network: "amazon", asin: "b0abc12345" } }, admin);
  assert.ifError(res.errors);
  assert.deepStrictEqual(
    { ...res.data.addOffer[0], _id: undefined },
    { _id: undefined, retailer: "Amazon", network: "amazon", asin: "B0ABC12345", url: null, active: true, status: "unknown" }
  );
  res = await t.gql(ADD, { b, o: { retailer: "Target", network: "direct", url: "https://www.target.com/p/1", packSize: "8 cans" } }, admin);
  const target = res.data.addOffer[1];

  res = await t.gql(EDIT, { b, id: target._id, o: { retailer: "Target", network: "direct", url: "https://www.target.com/p/2", packSize: "12 cans" } }, admin);
  assert.deepStrictEqual(res.data.editOffer[1].url, "https://www.target.com/p/2");
  assert.strictEqual(res.data.editOffer[1].packSize, "12 cans");

  assert.ifError((await t.gql(ACTIVE, { b, id: target._id, a: false }, admin)).errors);
  const publicOffers = (await t.gql(PUBLIC, { b })).data.bubblyWater.offers;
  assert.deepStrictEqual(publicOffers.map((o) => o.retailer), ["Amazon"]);
  const leak = await t.gql(`query($b: ID) { bubblyWater(bubblyWaterId: $b) { offers { url } } }`, { b });
  assert.match(leak.errors[0].message, /Cannot query field "url"/);
  assert.strictEqual((await t.gql(ADMIN_LIST, { b }, admin)).data.adminOffers.length, 2);
});

test("non-admins and visitors can't manage or list offers; bad offers are refused", async () => {
  const user = await createUser();
  const admin = await createUser({ role: "admin" });
  const b = String((await createBubbly())._id);
  const offer = { retailer: "Shop", network: "direct", url: "https://shop.example" };
  assert.strictEqual(code(await t.gql(ADD, { b, o: offer }, user)), "FORBIDDEN");
  assert.strictEqual(code(await t.gql(ADD, { b, o: offer })), "UNAUTHENTICATED");
  assert.strictEqual(code(await t.gql(ADMIN_LIST, { b }, user)), "FORBIDDEN");
  const bad = await t.gql(ADD, { b, o: { retailer: "Shop", network: "direct", url: "javascript:alert(1)" } }, admin);
  assert.strictEqual(code(bad), "BAD_USER_INPUT");
});

test("isAdmin answers only about yourself", async () => {
  const admin = await createUser({ role: "admin" });
  const user = await createUser();
  assert.strictEqual((await t.gql(`{ me { isAdmin } }`, {}, admin)).data.me.isAdmin, true);
  assert.strictEqual((await t.gql(`{ me { isAdmin } }`, {}, user)).data.me.isAdmin, false);
  const other = await t.gql(`query($id: ID!) { user(userId: $id) { isAdmin } }`, { id: String(admin._id) }, user);
  assert.strictEqual(other.data.user.isAdmin, null);
});
