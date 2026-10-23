// Run: node --test client/src/theme/flavorSurface.test.js (part of the root npm test)
import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { contrastRatio, inSrgbGamut, cssColorToOklch, parseOklch, oklchToHex } from "./color.js";
import { FLAVOR_COLORS } from "./flavorColors.js";
import { INK, flavorSurface, flavorAccent, flavorStarColor, accentStyle, starStyle, flavorBands, flavorBackground, flavorStyle } from "./flavorSurface.js";
import { DEFAULT_COLOR_SETTINGS as SHIPPED, setColorSettings as applySettings } from "./colorSettings.js";

// Most tests check the "aura" tone rules; palette tests opt into theirs. The site ships "splash".
const AURA = { ...SHIPPED, palette: "aura" };
applySettings(AURA);

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

test("Color Lab settings changes take effect live and can be reset", async () => {
  const { DEFAULT_COLOR_SETTINGS, setColorSettings } = await import("./colorSettings.js");
  const before = flavorSurface("lime").light;
  setColorSettings({ ...AURA, card: { ...DEFAULT_COLOR_SETTINGS.card, light: { lightness: 0.8, maxChroma: 0.2 } } });
  assert.match(flavorSurface("lime").light, /^oklch\(0\.8 /);
  setColorSettings({ ...AURA, flavorOverrides: { lime: "#0000ff" } });
  assert.ok(Math.abs(parseOklch(flavorSurface("lime").light).h - cssColorToOklch("#0000ff").h) < 1, "override changes the hue");
  setColorSettings(AURA);
  assert.strictEqual(flavorSurface("lime").light, before);
});

test("mode forces one color mode into both CSS variables", () => {
  const dark = flavorStyle(["lime"], "dark");
  assert.strictEqual(dark["--surface-bg"], dark["--surface-bg-dark"]);
  assert.strictEqual(dark["--surface-bg"], flavorBackground(["lime"], "dark"));
  const light = accentStyle("lime", "light");
  assert.strictEqual(light["--accent-dark"], flavorAccent("lime").light);
  const normal = starStyle("lime");
  assert.notStrictEqual(normal["--star"], normal["--star-dark"]);
});

test("every background pattern produces a valid background, and texture tints stay readable", async () => {
  const { DEFAULT_COLOR_SETTINGS, setColorSettings } = await import("./colorSettings.js");
  const { flavorBackground } = await import("./flavorSurface.js");
  try {
    for (const pattern of ["bands", "waves", "bubbles", "gradient", "stripes"]) {
      setColorSettings({ ...AURA, pattern });
      for (const flavors of [["lime"], ["lime", "raspberry"], ["lime", "raspberry", "lemon"]]) {
        for (const mode of ["light", "dark"]) {
          const bg = flavorBackground(flavors, mode);
          assert.ok(typeof bg === "string" && bg.length > 10, `${pattern} ${flavors} ${mode}`);
          for (const tone of bg.match(/oklch\([^)]*\)/g) || []) {
            assert.ok(contrastRatio(tone, INK[mode]) >= 4.5, `${pattern}: ${tone} not readable`);
          }
        }
      }
    }
    setColorSettings({ ...AURA, pattern: "waves" });
    const background = flavorBackground(["lime", "raspberry"], "light");
    const encoded = /url\("data:image\/svg\+xml,([^"]+)"\)/.exec(background);
    assert.ok(encoded, "waves use an inline SVG");
    const svg = decodeURIComponent(encoded[1]);
    assert.match(svg, /^<svg /);
    assert.match(svg, /fill="#[0-9a-f]{6}"/);
    assert.doesNotMatch(svg, /oklch/, "SVG uses hex, not oklch");
    // Tiny bubbles sit in the bottom half, in the color of the flavor above the bottom wave.
    const { flavorBubbles } = await import("./flavorSurface.js");
    const bubbles = flavorBubbles(["lime", "raspberry"], "light");
    assert.ok(parseFloat(bubbles["--bubbles-top"]) >= 50, "bubbles only in the bottom half");
    const tile = decodeURIComponent(/url\("data:image\/svg\+xml,([^"]+)"\)/.exec(bubbles["--bubbles"])[1]);
    const topColor = oklchToHex(flavorSurface("lime").light);
    assert.match(tile, new RegExp(`<circle[^>]*fill="${topColor}"`));
    setColorSettings({ ...AURA, pattern: "bands" });
    assert.deepEqual(flavorBubbles(["lime", "raspberry"], "light"), {}, "no bubbles on other patterns");
  } finally {
    setColorSettings(AURA);
  }
});

test("every brand has a border color; overrides and unknown brands work", async () => {
  const { DEFAULT_COLOR_SETTINGS, setColorSettings } = await import("./colorSettings.js");
  const { brandColor, brandStyle } = await import("./flavorSurface.js");
  const { BRAND_COLORS, DEFAULT_BRAND_COLOR } = await import("./brandColors.js");
  const { readFileSync } = await import("node:fs");
  const brandLogos = JSON.parse(readFileSync(new URL("../assets/brandLogos.json", import.meta.url), "utf8"));
  for (const { name } of brandLogos) assert.match(BRAND_COLORS[name] || "", /^#[0-9a-f]{6}$/, name);
  assert.strictEqual(brandColor("liquid-death"), "#111111");
  assert.strictEqual(brandColor("brand-new-fizz"), DEFAULT_BRAND_COLOR);
  try {
    setColorSettings({ ...AURA, brandColorOverrides: { spindrift: "#1b365d" } });
    assert.deepStrictEqual(brandStyle("spindrift"), { "--brand": "#1b365d" });
  } finally {
    setColorSettings(AURA);
  }
});

test("vibrant, white and splash palettes keep every flavor readable, with lemons yellow (not olive)", async () => {
  const { DEFAULT_COLOR_SETTINGS, setColorSettings } = await import("./colorSettings.js");
  try {
    for (const palette of ["vibrant", "white", "splash", "fizz"]) {
      setColorSettings({ ...AURA, palette });
      for (const flavor of Object.keys(FLAVOR_COLORS)) {
        for (const mode of ["light", "dark"]) {
          for (const tone of [flavorSurface(flavor)[mode], flavorAccent(flavor)[mode]]) {
            assert.ok(contrastRatio(tone, INK[mode]) >= 4.5, `${palette} ${flavor} ${mode}: ${tone} not readable`);
          }
          const bg = flavorBackground([flavor, "lime"], mode);
          for (const tone of bg.match(/oklch\([^)]*\)/g) || []) {
            assert.ok(contrastRatio(tone, INK[mode]) >= 4.5, `${palette} background ${tone} not readable`);
          }
        }
      }
    }
    setColorSettings({ ...AURA, palette: "vibrant" });
    const lemon = parseOklch(flavorSurface("lemon").light);
    assert.ok(lemon.l >= 0.9 && lemon.c >= 0.15, `vibrant lemon should be bright yellow, got ${flavorSurface("lemon").light}`);
  } finally {
    setColorSettings(AURA);
  }
});

test("splash is the shipped palette, and its stars are vivid, not brown", async () => {
  const { setColorSettings } = await import("./colorSettings.js");
  assert.strictEqual(SHIPPED.palette, "splash");
  try {
    setColorSettings(SHIPPED);
    for (const flavor of ["lemon", "orange", "pineapple", "mango", "lime", "raspberry", "blueberry", "grape"]) {
      const { l, c } = parseOklch(flavorStarColor(flavor).light);
      assert.ok(c >= 0.12, `${flavor} star is dull: ${flavorStarColor(flavor).light}`);
      assert.ok(l < parseOklch(flavorSurface(flavor).light).l, `${flavor} star should be darker than its fill`);
    }
  } finally {
    setColorSettings(AURA);
  }
});
