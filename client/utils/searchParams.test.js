import { test } from "node:test";
import assert from "node:assert";
import { readSearchParams, toVariables, toSearchString, searchUrl } from "./searchParams.js";

test("URL params round-trip to search state and back, dropping defaults", () => {
  const url = "?q=lime&flavor=Lime,%20mint&caffeine=0&cbd=1&sort=popular&page=2";
  const state = readSearchParams(new URLSearchParams(url));
  assert.deepStrictEqual(state, { q: "lime", flavor: ["lime", "mint"], caffeine: false, cbd: true, sortKey: "popular", page: 2 });
  assert.strictEqual(toSearchString(state), "?q=lime&flavor=lime%2Cmint&caffeine=0&cbd=1&sort=popular&page=2");
  assert.deepStrictEqual(toVariables(state), { q: "lime", flavor: ["lime", "mint"], caffeine: false, cbd: true, sort: "MOST_RATED", page: 2, pageSize: 24 });
});

test("empty or junk params mean 'any', top rated, page 1", () => {
  const state = readSearchParams(new URLSearchParams("?caffeine=maybe&sort=chaos&page=-4"));
  assert.deepStrictEqual(state, { q: "", flavor: [], caffeine: undefined, cbd: undefined, sortKey: "top", page: 1 });
  assert.strictEqual(toSearchString(state), "");
  assert.strictEqual(toVariables(state).sort, "TOP_RATED");
  assert.strictEqual(searchUrl({ flavor: ["lime"] }), "/search?flavor=lime");
  assert.strictEqual(searchUrl({ q: "la croix" }), "/search?q=la+croix");
});
