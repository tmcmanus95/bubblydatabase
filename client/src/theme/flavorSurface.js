// Card colors from flavor colors: each flavor keeps its own hue; the numbers that decide how light and how
// vivid each role gets live in colorSettings.js (tweak them live at /working/colors).
//   card  (flavorSurface)   one fixed lightness per mode, so the dark ink reads on every flavor and band.
//                           Dark mode stays bright (stickers on a dark page): darker tones turned yellows
//                           and oranges muddy.
//   pill  (flavorAccent)    each hue at its natural vivid lightness within a range (yellows high, blues low,
//                           so yellows never turn olive); dark mode searches above the deeper card.
//   star  (flavorStarColor) always clearly darker than the card so filled stars read as filled.
import { cssColorToOklch, formatOklch, maxChroma, parseOklch } from "./color.js";
import { flavorColor } from "./flavorColors.js";
import { getColorSettings, colorSettingsVersion } from "./colorSettings.js";

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

// CSS custom properties for an element with the "flavor-surface" class (see index.css)
export function flavorStyle(flavors, mode) {
  return pair("surface-bg", { light: flavorBands(flavors, "light"), dark: flavorBands(flavors, "dark") }, mode);
}
