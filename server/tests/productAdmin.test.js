// P2-2: admins create, update, archive and restore products; archived products vanish from every public list
// and search (ratings kept); every change is audit-logged.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const { startTestServer } = require("./helpers");
const { createUser, createBubbly, addRatingFor } = require("./fixtures");
const { Rating } = require("../models");

let t;
before(async () => {
  t = await startTestServer();
});
after(() => t.stop());
beforeEach(() => t.reset());

const CREATE = `mutation($p: ProductInput!) { createProduct(product: $p) { _id productName brandName flavor isCaffeinated tags } }`;
const UPDATE = `mutation($id: ID!, $p: ProductInput!) { updateProduct(bubblyWaterId: $id, product: $p) { productName flavor } }`;
const ARCHIVE = `mutation($id: ID!) { archiveProduct(bubblyWaterId: $id) { archivedAt } }`;
const RESTORE = `mutation($id: ID!) { restoreProduct(bubblyWaterId: $id) { archivedAt } }`;
const LOG = `query($id: ID) { adminEdits(targetId: $id) { action } }`;
const code = (res) => res.errors && res.errors[0].extensions.code;
const lime = { productName: "  Lime Zest ", brandName: "La-Croix", flavor: ["Lime"], isCaffeinated: false, tags: ["Citrus"] };

test("admins create and update products, normalized and audit-logged; duplicates refused", async () => {
  const admin = await createUser({ role: "admin" });
  const res = await t.gql(CREATE, { p: lime }, admin);
  assert.ifError(res.errors);
  const p = res.data.createProduct;
  assert.deepStrictEqual([p.productName, p.brandName, p.flavor, p.tags], ["Lime Zest", "la-croix", ["lime"], ["citrus"]]);
  const dup = await t.gql(CREATE, { p: { ...lime, productName: "LIME ZEST" } }, admin);
  assert.match(dup.errors[0].message, /already exists/);
  const upd = await t.gql(UPDATE, { id: p._id, p: { ...lime, flavor: ["lime", "mint"] } }, admin);
  assert.deepStrictEqual(upd.data.updateProduct.flavor, ["lime", "mint"]);
  assert.deepStrictEqual((await t.gql(LOG, { id: p._id }, admin)).data.adminEdits.map((e) => e.action), ["product.update", "product.create"]);
});

test("archived products disappear from public lists, search and their page, keep ratings, and come back on restore", async () => {
  const admin = await createUser({ role: "admin" });
  const fans = await Promise.all([1, 2, 3, 4].map(() => createUser()));
  const water = await createBubbly({ productName: "Lime", brandName: "la-croix", flavor: ["lime"], isCaffeinated: true });
  for (const f of fans) await addRatingFor(f, water, 4);
  const id = String(water._id);
  const visible = async (who) => {
    const q = await t.gql(
      `query($id: ID) { bubblyWaters { _id } flavors(flavor: ["lime"]) { _id } brand(brandName: "la-croix") { _id } caffeinatedBubblys { _id } search(q: "lime") { total } bubblyWater(bubblyWaterId: $id) { _id } }`,
      { id },
      who
    );
    assert.ifError(q.errors);
    const d = q.data;
    return { home: d.bubblyWaters.length, flavor: d.flavors.length, brand: d.brand.length, caffeine: d.caffeinatedBubblys.length, search: d.search.total, page: Boolean(d.bubblyWater) };
  };
  assert.deepStrictEqual(await visible(), { home: 1, flavor: 1, brand: 1, caffeine: 1, search: 1, page: true });
  assert.ok((await t.gql(ARCHIVE, { id }, admin)).data.archiveProduct.archivedAt);
  assert.deepStrictEqual(await visible(), { home: 0, flavor: 0, brand: 0, caffeine: 0, search: 0, page: false });
  assert.strictEqual((await visible(admin)).page, true, "admins can still open it to restore it");
  assert.strictEqual(await Rating.countDocuments({ bubblyWater: water._id }), 4, "ratings kept");
  assert.strictEqual((await t.gql(RESTORE, { id }, admin)).data.restoreProduct.archivedAt, null);
  assert.deepStrictEqual(await visible(), { home: 1, flavor: 1, brand: 1, caffeine: 1, search: 1, page: true });
  assert.deepStrictEqual((await t.gql(LOG, { id }, admin)).data.adminEdits.map((e) => e.action), ["product.restore", "product.archive"]);
});

test("non-admins can't manage products; bad input is refused", async () => {
  const user = await createUser();
  const admin = await createUser({ role: "admin" });
  const id = String((await createBubbly())._id);
  assert.strictEqual(code(await t.gql(CREATE, { p: lime }, user)), "FORBIDDEN");
  assert.strictEqual(code(await t.gql(ARCHIVE, { id }, user)), "FORBIDDEN");
  assert.strictEqual(code(await t.gql(ARCHIVE, { id })), "UNAUTHENTICATED");
  for (const bad of [{ ...lime, flavor: [] }, { ...lime, brandName: "La Croix!" }, { ...lime, productName: " " }]) {
    assert.strictEqual(code(await t.gql(CREATE, { p: bad }, admin)), "BAD_USER_INPUT", JSON.stringify(bad));
  }
});

test("bulk edit adds/removes flavors and tags across products; never leaves a product flavorless", async () => {
  const admin = await createUser({ role: "admin" });
  const a = await createBubbly({ productName: "A", flavor: ["lime"], tags: ["citrus"] });
  const b = await createBubbly({ productName: "B", flavor: ["lime", "mint"], tags: [] });
  const BULK = `mutation($ids: [ID!]!, $af: [String!], $rf: [String!], $at: [String!], $rt: [String!]) {
    bulkEditProducts(bubblyWaterIds: $ids, addFlavors: $af, removeFlavors: $rf, addTags: $at, removeTags: $rt) { productName flavor tags } }`;
  const res = await t.gql(BULK, { ids: [String(a._id), String(b._id)], af: ["Lemon"], rf: ["mint"], at: ["Zesty"], rt: ["citrus"] }, admin);
  assert.ifError(res.errors);
  const byName = Object.fromEntries(res.data.bulkEditProducts.map((p) => [p.productName, p]));
  assert.deepStrictEqual(byName.A, { productName: "A", flavor: ["lime", "lemon"], tags: ["zesty"] });
  assert.deepStrictEqual(byName.B, { productName: "B", flavor: ["lime", "lemon"], tags: ["zesty"] });
  const empty = await t.gql(BULK, { ids: [String(a._id)], rf: ["lime", "lemon"] }, admin);
  assert.match(empty.errors[0].message, /no flavors/);
  assert.strictEqual((await t.gql(BULK, { ids: [String(a._id)], af: ["x"] }, await createUser())).errors[0].extensions.code, "FORBIDDEN");
});

test("only admins can search archived products", async () => {
  const admin = await createUser({ role: "admin" });
  const water = await createBubbly({ productName: "Ghost Lime" });
  await t.gql(ARCHIVE, { id: String(water._id) }, admin);
  const Q = `{ search(q: "ghost", includeArchived: true) { total results { archivedAt } } }`;
  assert.strictEqual((await t.gql(Q, {}, admin)).data.search.total, 1);
  assert.ok((await t.gql(Q, {}, admin)).data.search.results[0].archivedAt);
  assert.strictEqual((await t.gql(Q, {}, await createUser())).data.search.total, 0, "ignored for non-admins");
  assert.strictEqual((await t.gql(Q)).data.search.total, 0);
});
