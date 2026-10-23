// Run: node --test client/src/theme/flavorSurface.test.js (part of the root npm test)
import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { contrastRatio, inSrgbGamut, cssColorToOklch } from "./color.js";
import { FLAVOR_COLORS } from "./flavorColors.js";
import { INK, flavorSurface, flavorBands, flavorStyle } from "./flavorSurface.js";

test("color math matches known values", () => {
  assert.strictEqual(contrastRatio("oklch(1 0 0)", "oklch(0 0 0)").toFixed(1), "21.0");
  assert.ok(inSrgbGamut("oklch(0.6279554 0.2576833 29.2338851)"), "pure sRGB red is in gamut");
  assert.ok(!inSrgbGamut("oklch(0.7 0.35 145)"), "a very saturated green is not");
  const red = cssColorToOklch("#ff0000");
  assert.strictEqual(red.l.toFixed(3), "0.628");
  assert.strictEqual(red.h.toFixed(1), "29.2");
  assert.deepStrictEqual(cssColorToOklch("pink"), cssColorToOklch("#ffc0cb"));
});

test("every flavor's card color is in gamut and passes WCAG AA with the ink, in both modes", () => {
  for (const flavor of Object.keys(FLAVOR_COLORS)) {
    const surface = flavorSurface(flavor);
    for (const mode of ["light", "dark"]) {
      assert.ok(inSrgbGamut(surface[mode]), `${flavor} ${mode} out of gamut: ${surface[mode]}`);
      const ratio = contrastRatio(surface[mode], INK[mode]);
      assert.ok(ratio >= 4.5, `${flavor} ${mode}: contrast ${ratio.toFixed(2)} < 4.5`);
    }
  }
});

test("flavors keep their own hue", () => {
  const hue = (c) => Number(/oklch\([\d.]+ [\d.]+ ([\d.]+)\)/.exec(c)[1]);
  const source = cssColorToOklch(FLAVOR_COLORS.lime).h;
  assert.ok(Math.abs(hue(flavorSurface("lime").light) - source) < 1);
});

test("one flavor is a solid fill; several become hard-edged bands", () => {
  assert.strictEqual(flavorBands(["lime"], "light"), flavorSurface("lime").light);
  const bands = flavorBands(["lime", "raspberry"], "dark");
  assert.match(bands, /^linear-gradient\(115deg, /);
  assert.ok(bands.includes(`${flavorSurface("lime").dark} 0.00% 50.00%`));
  assert.ok(bands.includes(`${flavorSurface("raspberry").dark} 50.00% 100.00%`));
  assert.strictEqual(flavorBands([], "light"), flavorSurface("plain").light);
  assert.deepStrictEqual(Object.keys(flavorStyle(["lime"])).sort(), ["--surface-bg", "--surface-bg-dark"]);
});

test("index.css uses the same ink color as flavorSurface.js", () => {
  const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
  assert.strictEqual(INK.light, INK.dark, "one dark ink in both modes");
  assert.ok(css.includes(`--ink: ${INK.light};`));
});
