// Card colors from flavor colors: each flavor keeps its own hue; the numbers that decide how light and how
// vivid each role gets live in colorSettings.js (tweak them live at /working/colors).
//   card  (flavorSurface)   one fixed lightness per mode, so the dark ink reads on every flavor and band.
//                           Dark mode stays bright (stickers on a dark page): darker tones turned yellows
//                           and oranges muddy.
//   pill  (flavorAccent)    each hue at its natural vivid lightness within a range (yellows high, blues low,
//                           so yellows never turn olive); dark mode searches above the deeper card.
//   star  (flavorStarColor) always clearly darker than the card so filled stars read as filled.
import { cssColorToOklch, formatOklch, maxChroma, oklchToHex, parseOklch } from "./color.js";
import { flavorColor } from "./flavorColors.js";
import { getColorSettings, colorSettingsVersion } from "./colorSettings.js";
import { BRAND_COLORS, DEFAULT_BRAND_COLOR } from "./brandColors.js";

const DARK_INK = "oklch(0.24 0.02 60)";
export const INK = { light: DARK_INK, dark: DARK_INK };

const PILL_STEP = 0.02;

// Caches keyed by flavor color; emptied whenever the settings change
const caches = { surface: new Map(), accent: new Map(), star: new Map() };
let cachedVersion = colorSettingsVersion();
const cacheFor = (name) => {
  if (cachedVersion !== colorSettingsVersion()) {
    Object.values(caches).forEach((c) => c.clear());
    cachedVersion = colorSettingsVersion();
  }
  return caches[name];
};

// The flavor's base color: a Color Lab / settings override, else flavorColors.js
const baseColor = (flavor) => {
  const key = String(flavor || "").trim().toLowerCase().replace(/\s+/g, "-");
  return getColorSettings().flavorOverrides[key] || flavorColor(flavor);
};

const tone = ({ c, h }, l, cap) => formatOklch({ l, c: Math.min(c, cap, maxChroma(l, h) * 0.95), h });

// { light, dark } background colors for one flavor
export function flavorSurface(flavor) {
  const source = baseColor(flavor);
  const cache = cacheFor("surface");
  if (!cache.has(source)) {
    const { card } = getColorSettings();
    const color = cssColorToOklch(source);
    cache.set(source, {
      light: tone(color, card.light.lightness, card.light.maxChroma),
      dark: tone(color, card.dark.lightness, card.dark.maxChroma),
    });
  }
  return cache.get(source);
}

// The hue's natural vivid lightness within a range: where the gamut allows the most color for this hue
const pillTone = (color, { minLightness, maxLightness }, cap, prefer) => {
  const candidates = [];
  for (let l = minLightness; l <= maxLightness + 1e-9; l += PILL_STEP) {
    candidates.push({ l, room: maxChroma(l, color.h) });
  }
  if (prefer === "lightest") candidates.reverse();
  const mostRoom = Math.max(...candidates.map((t) => t.room));
  return tone(color, candidates.find((t) => t.room >= mostRoom * 0.98).l, cap);
};

// { light, dark } vivid tones of one flavor for pills and the score badge
export function flavorAccent(flavor) {
  const source = baseColor(flavor);
  const cache = cacheFor("accent");
  if (!cache.has(source)) {
    const { pill } = getColorSettings();
    const color = cssColorToOklch(source);
    cache.set(source, {
      light: pillTone(color, pill.light, pill.maxChroma, "darkest"),
      dark: pillTone(color, pill.dark, pill.maxChroma, "lightest"),
    });
  }
  return cache.get(source);
}

// { light, dark } star fill: the pill tone in light mode unless that's too close to the card (yellows), and
// a rich deep tone in dark mode, where cards are brighter
export function flavorStarColor(flavor) {
  const source = baseColor(flavor);
  const cache = cacheFor("star");
  if (!cache.has(source)) {
    const { card, pill, star } = getColorSettings();
    const color = cssColorToOklch(source);
    const pillL = parseOklch(flavorAccent(flavor).light).l;
    cache.set(source, {
      light: tone(color, Math.min(pillL, card.light.lightness - star.lightModeGapBelowCard), pill.maxChroma),
      dark: tone(color, star.darkLightness, pill.maxChroma),
    });
  }
  return cache.get(source);
}

// Picks one mode's value for both CSS variables, so `mode` can force light or dark (the Color Lab does)
const pair = (name, { light, dark }, mode) => ({
  [`--${name}`]: mode === "dark" ? dark : light,
  [`--${name}-dark`]: mode === "light" ? light : dark,
});

// CSS custom properties for a flavor pill or the score badge (index.css)
export function accentStyle(flavor, mode) {
  return pair("accent", flavorAccent(flavor), mode);
}

// CSS custom properties for stars (.stars in index.css)
export function starStyle(flavor, mode) {
  return pair("star", flavorStarColor(flavor), mode);
}

// Hover/focus shadow: a strong flavor color that pops off the page. Light page: the deep vivid star tone;
// dark page: the bright pastel pill tone.
export function popStyle(flavor, mode) {
  return pair("pop", { light: flavorStarColor(flavor).light, dark: flavorAccent(flavor).dark }, mode);
}

// Hard-edged diagonal bands, one per flavor (a single flavor is a solid fill). Not a smooth gradient.
export function flavorBands(flavors, mode) {
  const colors = (flavors.length ? flavors : ["plain"]).map((f) => flavorSurface(f)[mode]);
  if (colors.length === 1) return colors[0];
  const step = 100 / colors.length;
  const stops = colors.map((col, i) => `${col} ${(i * step).toFixed(2)}% ${((i + 1) * step).toFixed(2)}%`);
  return `linear-gradient(${getColorSettings().bandAngle}deg, ${stops.join(", ")})`;
}

// A lighter, softer tint of a card tone: texture for single-flavor waves/bubbles. Lighter keeps the ink
// readable.
const tint = (color) => {
  const { l, c, h } = parseOklch(color);
  return formatOklch({ l: Math.min(0.97, l + 0.06), c: c * 0.6, h });
};

// Bubble positions (% of the card) and radii (px): a loose cluster rising on the right
const BUBBLES = [
  { x: 88, y: 82, r: 34 },
  { x: 70, y: 96, r: 18 },
  { x: 95, y: 40, r: 16 },
  { x: 78, y: 58, r: 10 },
  { x: 60, y: 74, r: 8 },
  { x: 84, y: 18, r: 7 },
  { x: 8, y: 92, r: 12 },
  { x: 40, y: 104, r: 22 },
];

// A wavy edge from x=0 to x=400 around height y (in a 400×200 box)
const wave = (y) => `M0 ${y} C 70 ${y - 22}, 130 ${y + 22}, 200 ${y} S 330 ${y - 22}, 400 ${y} V200 H0 Z`;

// The card background for a mode, in the pattern chosen in colorSettings.js. Every pattern only
// rearranges the same card tones, so readability is the same in all of them.
export function flavorBackground(flavors, mode) {
  const list = flavors.length ? flavors : ["plain"];
  const colors = list.map((f) => flavorSurface(f)[mode]);
  const { pattern, bandAngle } = getColorSettings();
  switch (pattern) {
    case "gradient":
      return colors.length === 1 ? colors[0] : `linear-gradient(${bandAngle}deg, ${colors.join(", ")})`;
    case "stripes": {
      if (colors.length === 1) return colors[0];
      const width = 22;
      const stops = colors.map((col, i) => `${col} ${i * width}px ${(i + 1) * width}px`);
      return `repeating-linear-gradient(${bandAngle}deg, ${stops.join(", ")})`;
    }
    case "bubbles": {
      const base = colors[0];
      const bubbleColors = colors.length > 1 ? colors.slice(1) : [tint(base)];
      const circles = BUBBLES.map(
        ({ x, y, r }, i) =>
          `radial-gradient(circle at ${x}% ${y}%, ${bubbleColors[i % bubbleColors.length]} 0 ${r}px, transparent ${r + 1}px)`
      );
      return `${circles.join(", ")}, ${base}`;
    }
    case "waves": {
      const layers = colors.length > 1 ? colors : [colors[0], tint(colors[0])];
      const paths = layers
        .slice(1)
        .map((col, i) => `<path d="${wave((200 * (i + 1)) / layers.length)}" fill="${oklchToHex(col)}"/>`)
        .join("");
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" preserveAspectRatio="none"><rect width="400" height="200" fill="${oklchToHex(layers[0])}"/>${paths}</svg>`;
      return `url("data:image/svg+xml,${encodeURIComponent(svg)}") center / 100% 100% no-repeat, ${layers[0]}`;
    }
    default:
      return flavorBands(list, mode);
  }
}

// CSS custom properties for an element with the "flavor-surface" class (see index.css)
export function flavorStyle(flavors, mode) {
  return pair(
    "surface-bg",
    { light: flavorBackground(flavors, "light"), dark: flavorBackground(flavors, "dark") },
    mode
  );
}

// The brand's package color for the card border (brandColors.js, or a Color Lab / settings override)
export function brandColor(brandName) {
  const key = String(brandName || "").trim().toLowerCase();
  return getColorSettings().brandColorOverrides[key] || BRAND_COLORS[key] || DEFAULT_BRAND_COLOR;
}

export function brandStyle(brandName) {
  return { "--brand": brandColor(brandName) };
}
