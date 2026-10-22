// Run: node --test client/src/theme/brandColors.test.js (part of the root npm test)
import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { BRAND_PALETTE, BRAND_COLORS, brandColorName, getBrandColor, brandStyle } from "./brandColors.js";
import { contrastRatio, inSrgbGamut } from "./color.js";

test("color math matches known values", () => {
  assert.strictEqual(contrastRatio("oklch(1 0 0)", "oklch(0 0 0)").toFixed(1), "21.0");
  assert.ok(inSrgbGamut("oklch(0.6279554 0.2576833 29.2338851)"), "pure sRGB red is in gamut");
  assert.ok(!inSrgbGamut("oklch(0.7 0.35 145)"), "a very saturated green is not");
});

for (const [name, token] of Object.entries(BRAND_PALETTE)) {
  test(`palette "${name}": in sRGB gamut and WCAG AA text contrast in light and dark mode`, () => {
    for (const mode of ["light", "dark"]) {
      const { bg, ink } = token[mode];
      assert.ok(inSrgbGamut(bg), `${name} ${mode} bg out of gamut: ${bg}`);
      assert.ok(inSrgbGamut(ink), `${name} ${mode} ink out of gamut: ${ink}`);
      const ratio = contrastRatio(bg, ink);
      assert.ok(ratio >= 4.5, `${name} ${mode} contrast ${ratio.toFixed(2)} < 4.5`);
    }
  });
}

test("every assigned brand uses a real palette color", () => {
  for (const [brand, color] of Object.entries(BRAND_COLORS)) {
    assert.ok(BRAND_PALETTE[color], `${brand} → unknown color "${color}"`);
  }
});

test("every brand with a page today has an explicit color", () => {
  const brandLogos = JSON.parse(readFileSync(new URL("../assets/brandLogos.json", import.meta.url), "utf8"));
  for (const { name } of brandLogos) {
    assert.ok(BRAND_COLORS[name], `${name} has no explicit color`);
  }
});

test("unknown brands get a stable color, and lookups ignore case and spaces", () => {
  const first = brandColorName("brand-new-fizz");
  assert.ok(BRAND_PALETTE[first]);
  assert.strictEqual(brandColorName("brand-new-fizz"), first);
  assert.strictEqual(brandColorName("  LA-CROIX "), "bubblegum");
  assert.deepStrictEqual(getBrandColor(undefined), getBrandColor(""));
});

test("brandStyle returns the CSS variables used by .brand-surface", () => {
  assert.deepStrictEqual(Object.keys(brandStyle("bubly")).sort(), ["--brand-bg", "--brand-bg-dark", "--brand-ink", "--brand-ink-dark"]);
  const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
  for (const v of ["--brand-bg", "--brand-ink", "--brand-bg-dark", "--brand-ink-dark"]) assert.ok(css.includes(`var(${v})`), v);
});
