// Run: node --test client/src/theme/flavorColors.test.js (part of the root npm test)
import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { FLAVOR_COLORS, DEFAULT_FLAVOR_COLOR, flavorColor } from "./flavorColors.js";

const css = readFileSync(new URL("../App.css", import.meta.url), "utf8");
const flavorsSource = readFileSync(new URL("../assets/flavors.js", import.meta.url), "utf8");
const flavors = [...flavorsSource.matchAll(/"([^"]+)"/g)].map((m) => m[1]);

test("every flavor has a color, matching its class in App.css", () => {
  for (const name of flavors) {
    const rule = new RegExp(`\\n\\.${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^}]*)\\}`).exec(css);
    assert.ok(rule, `no .${name} class in App.css`);
    const cssColor = /background-color:\s*([^;]+);/.exec(rule[1])[1].trim();
    assert.strictEqual(FLAVOR_COLORS[name.toLowerCase()], cssColor, name);
  }
});

test("lookups ignore case and spaces; unknown flavors get the neutral fallback", () => {
  assert.strictEqual(flavorColor("Blood Orange"), FLAVOR_COLORS["blood-orange"]);
  assert.strictEqual(flavorColor("unicorn-tears"), DEFAULT_FLAVOR_COLOR);
  assert.strictEqual(flavorColor(undefined), DEFAULT_FLAVOR_COLOR);
});
