// Run: node --test client/src/theme/brandFonts.test.js (part of the root npm test)
import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { BRAND_FONTS, brandFont, brandFontStyle, brandFontsStylesheetUrl } from "./brandFonts.js";

test("every brand with a page today has its own font", () => {
  const brandLogos = JSON.parse(readFileSync(new URL("../assets/brandLogos.json", import.meta.url), "utf8"));
  for (const { name } of brandLogos) assert.ok(BRAND_FONTS[name], `${name} has no font`);
});

test("the Google Fonts URL requests every brand font family", () => {
  const url = brandFontsStylesheetUrl();
  assert.match(url, /^https:\/\/fonts\.googleapis\.com\/css2\?/);
  for (const { family } of Object.values(BRAND_FONTS)) {
    assert.ok(url.includes(`family=${family.replace(/ /g, "+")}`), family);
  }
  assert.ok(url.includes("Playfair+Display:ital,wght@1,900"), "italic + weight variants are encoded");
});

test("unknown brands fall back to the site display font; lookups ignore case", () => {
  assert.strictEqual(brandFont("brand-new-fizz").family, "Lilita One");
  assert.strictEqual(brandFont("  LA-CROIX ").family, "Pacifico");
  assert.deepStrictEqual(brandFontStyle("perrier"), {
    fontFamily: '"Playfair Display", "Lilita One", sans-serif',
    fontWeight: 900,
    fontStyle: "italic",
  });
});
