// Run: node --test client/src/theme/flavorSurface.test.js (part of the root npm test)
import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { contrastRatio, inSrgbGamut, cssColorToOklch, parseOklch } from "./color.js";
import { FLAVOR_COLORS } from "./flavorColors.js";
import { INK, flavorSurface, flavorAccent, flavorStarColor, accentStyle, starStyle, flavorBands, flavorStyle } from "./flavorSurface.js";

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

test("pill colors are in gamut, AA with the ink, vivid, and (in dark mode) clearly distinct from the card", () => {
  // Distance in OKLab between two oklch() strings
  const lab = (c) => {
    const { l, c: ch, h } = parseOklch(c);
    return [l, ch * Math.cos((h * Math.PI) / 180), ch * Math.sin((h * Math.PI) / 180)];
  };
  const distance = (x, y) => Math.hypot(...lab(x).map((v, i) => v - lab(y)[i]));
  for (const flavor of Object.keys(FLAVOR_COLORS)) {
    for (const mode of ["light", "dark"]) {
      const accent = flavorAccent(flavor)[mode];
      assert.ok(inSrgbGamut(accent), `${flavor} ${mode} accent out of gamut: ${accent}`);
      const ratio = contrastRatio(accent, INK[mode]);
      assert.ok(ratio >= 4.5, `${flavor} ${mode} accent: contrast ${ratio.toFixed(2)} < 4.5`);
      // Light mode: vivid, at least as colorful as the card (within rounding). Dark-mode pills are lighter
      // by design, so there they only need to be distinct.
      if (mode === "light") {
        assert.ok(parseOklch(accent).c >= parseOklch(flavorSurface(flavor).light).c - 0.02, `${flavor} pill duller than its card`);
      } else {
        const d = distance(accent, flavorSurface(flavor)[mode]);
        assert.ok(d >= 0.06, `${flavor} dark pill too close to its card (${d.toFixed(3)})`);
      }
    }
  }
});

test("filled stars stand out from their card in both modes", () => {
  const L = (c) => parseOklch(c).l;
  for (const flavor of Object.keys(FLAVOR_COLORS)) {
    for (const mode of ["light", "dark"]) {
      const star = flavorStarColor(flavor)[mode];
      assert.ok(inSrgbGamut(star), `${flavor} ${mode} star out of gamut`);
      const gap = Math.abs(L(star) - L(flavorSurface(flavor)[mode]));
      assert.ok(gap >= 0.08, `${flavor} ${mode} star too close to its card in lightness (${gap.toFixed(3)})`);
    }
  }
  assert.deepStrictEqual(Object.keys(starStyle("lime")).sort(), ["--star", "--star-dark"]);
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
  assert.deepStrictEqual(Object.keys(accentStyle("lime")).sort(), ["--accent", "--accent-dark"]);
});

test("index.css uses the same ink color as flavorSurface.js", () => {
  const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
  assert.strictEqual(INK.light, INK.dark, "one dark ink in both modes");
  assert.ok(css.includes(`--ink: ${INK.light};`));
});
