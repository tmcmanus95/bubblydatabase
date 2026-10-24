// P1-19: the unified search: each filter, combinations, sorting, pages, counts, and input limits.
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const { startTestServer } = require("./helpers");
const { createBubbly } = require("./fixtures");

let t;
const SEARCH = `query($q: String, $flavor: [String], $brand: String, $caffeine: Boolean, $cbd: Boolean, $sort: SearchSort, $page: Int, $pageSize: Int) {
  search(q: $q, flavor: $flavor, brand: $brand, caffeine: $caffeine, cbd: $cbd, sort: $sort, page: $page, pageSize: $pageSize) {
    total page pageSize results { productName brandName avgRating ratingCount }
  }
}`;
const search = async (vars) => {
  const res = await t.gql(SEARCH, vars);
  assert.ifError(res.errors);
  return res.data.search;
};
const names = (r) => r.results.map((b) => b.productName);

before(async () => {
  t = await startTestServer();
  const p = (productName, brandName, flavor, extra = {}) => createBubbly({ productName, brandName, flavor, tags: [...flavor, brandName], ...extra });
  await p("Lime", "la-croix", ["lime"], { avgRating: 4, ratingCount: 10 });
  await p("Pamplemousse", "la-croix", ["grapefruit"], { avgRating: 4.5, ratingCount: 3 });
  await p("Lime Mint", "spindrift", ["lime", "mint"], { avgRating: 3, ratingCount: 20 });
  await p("Lemon Energy", "sparkling-ice", ["lemon"], { isCaffeinated: true, avgRating: 2, ratingCount: 5 });
  await p("Calm Lime", "recess", ["lime"], { hasCBD: true, avgRating: 3.5, ratingCount: 1 });
});
after(() => t.stop());

test("no filters: everything, best rated first", async () => {
  const r = await search({});
  assert.strictEqual(r.total, 5);
  assert.deepStrictEqual(names(r), ["Pamplemousse", "Lime", "Calm Lime", "Lime Mint", "Lemon Energy"]);
});

test("text matches name, brand, tags and flavors, partial words, every word, case-insensitive, literally", async () => {
  assert.deepStrictEqual(names(await search({ q: "lim" })).sort(), ["Calm Lime", "Lime", "Lime Mint"]);
  assert.deepStrictEqual(names(await search({ q: "LIME mint" })), ["Lime Mint"]);
  assert.deepStrictEqual(names(await search({ q: "croix" })).sort(), ["Lime", "Pamplemousse"]);
  assert.strictEqual((await search({ q: ".*" })).total, 0, "regex syntax is plain text");
});

test("flavor (all selected), brand, caffeine and CBD filters, alone and combined", async () => {
  assert.strictEqual((await search({ flavor: ["lime"] })).total, 3);
  assert.deepStrictEqual(names(await search({ flavor: ["lime", "mint"] })), ["Lime Mint"]);
  assert.deepStrictEqual(names(await search({ flavor: ["Lime"], brand: "la-croix" })), ["Lime"]);
  assert.deepStrictEqual(names(await search({ caffeine: true })), ["Lemon Energy"]);
  assert.strictEqual((await search({ caffeine: false })).total, 4);
  assert.deepStrictEqual(names(await search({ cbd: true, flavor: ["lime"] })), ["Calm Lime"]);
  assert.deepStrictEqual(names(await search({ q: "lime", cbd: false, caffeine: false })).sort(), ["Lime", "Lime Mint"]);
  assert.strictEqual((await search({ flavor: ["lime"], caffeine: true })).total, 0);
});

test("sorting and pages", async () => {
  assert.deepStrictEqual(names(await search({ sort: "MOST_RATED", pageSize: 2 })), ["Lime Mint", "Lime"]);
  assert.deepStrictEqual(names(await search({ sort: "NAME" })), ["Calm Lime", "Lemon Energy", "Lime", "Lime Mint", "Pamplemousse"]);
  const page2 = await search({ sort: "NAME", pageSize: 2, page: 2 });
  assert.deepStrictEqual([page2.total, page2.page, page2.pageSize, names(page2)], [5, 2, 2, ["Lime", "Lime Mint"]]);
  assert.deepStrictEqual(names(await search({ sort: "NAME", pageSize: 2, page: 9 })), []);
});

test("out-of-range input is refused", async () => {
  for (const vars of [{ pageSize: 500 }, { page: 0 }, { q: "x".repeat(200) }]) {
    assert.strictEqual((await t.gql(SEARCH, vars)).errors[0].extensions.code, "BAD_USER_INPUT", JSON.stringify(vars).slice(0, 40));
  }
});
