// Run: node --test client/src/theme/flavorCategories.test.js (part of the root npm test)
import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { FLAVOR_CATEGORIES, flavorCategory } from "./flavorCategories.js";

test("every flavor in the flavor list has a category", () => {
  const source = readFileSync(new URL("../assets/flavors.js", import.meta.url), "utf8");
  const flavors = [...source.matchAll(/"([^"]+)"/g)].map((m) => m[1].toLowerCase());
  assert.ok(flavors.length > 80);
  const missing = flavors.filter((f) => flavorCategory(f) === "bubbles");
  assert.deepStrictEqual(missing, []);
});

test("no flavor is in two categories", () => {
  const seen = new Map();
  for (const [category, flavors] of Object.entries(FLAVOR_CATEGORIES)) {
    for (const f of flavors) {
      assert.ok(!seen.has(f), `${f} is in both ${seen.get(f)} and ${category}`);
      seen.set(f, category);
    }
  }
});

test("lookups ignore case and spaces; unknown flavors get bubbles", () => {
  assert.strictEqual(flavorCategory("Blood Orange"), "citrus");
  assert.strictEqual(flavorCategory("  RASPBERRY "), "berry");
  assert.strictEqual(flavorCategory("unicorn-tears"), "bubbles");
  assert.strictEqual(flavorCategory(undefined), "bubbles");
});
