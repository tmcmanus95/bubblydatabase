// Card colors from flavor colors (P1-0c follow-up): each flavor's hue at one fixed lightness per mode,
// so every flavor stays recognizable and the dark ink stays readable on all of them, including across
// the bands of multi-flavor cards. Dark mode uses slightly deeper but still bright tones (bright stickers
// on a dark page): darker tones turned yellows and oranges muddy olive/brown.
import { cssColorToOklch, formatOklch, maxChroma, parseOklch } from "./color.js";
import { flavorColor } from "./flavorColors.js";

const DARK_INK = "oklch(0.24 0.02 60)";
export const INK = { light: DARK_INK, dark: DARK_INK };

const LIGHTNESS = { light: 0.86, dark: 0.72 };
const MAX_CHROMA = { light: 0.17, dark: 0.18 };

// Accent tones for flavor pills, as vivid as the hue allows while staying AA with the dark ink. Each hue
// sits at its natural vivid lightness (where sRGB can show it most colorfully: yellows high, blues low),
// so yellows never turn olive. Light mode searches up to the card's lightness; dark mode above the deeper
// dark-mode card, so pills read as bright pills there. Ink outlines + offset shadows separate pills.
const ACCENT_LIGHTNESS = {
  light: { min: 0.68, max: 0.84, prefer: "darkest" },
  dark: { min: 0.86, max: 0.94, prefer: "lightest" },
};
const ACCENT_STEP = 0.02;
const ACCENT_MAX_CHROMA = 0.22;

const cache = new Map();

// { light, dark } background colors for one flavor
export function flavorSurface(flavor) {
  const source = flavorColor(flavor);
  if (cache.has(source)) return cache.get(source);
  const { c, h } = cssColorToOklch(source);
  const tone = (mode) => {
    const l = LIGHTNESS[mode];
    return formatOklch({ l, c: Math.min(c, MAX_CHROMA[mode], maxChroma(l, h) * 0.95), h });
  };
  const surface = { light: tone("light"), dark: tone("dark") };
  cache.set(source, surface);
  return surface;
}

const accentCache = new Map();

const accentTone = ({ c, h }, { min, max, prefer }) => {
  // The hue's natural vivid lightness: where the gamut allows the most color for this hue
  const candidates = [];
  for (let l = min; l <= max + 1e-9; l += ACCENT_STEP) candidates.push({ l, room: maxChroma(l, h) });
  if (prefer === "lightest") candidates.reverse();
  const mostRoom = Math.max(...candidates.map((t) => t.room));
  const { l, room } = candidates.find((t) => t.room >= mostRoom * 0.98);
  return formatOklch({ l, c: Math.min(c, ACCENT_MAX_CHROMA, room * 0.95), h });
};

// { light, dark } vivid tones of one flavor for pills and stars
export function flavorAccent(flavor) {
  const source = flavorColor(flavor);
  if (!accentCache.has(source)) {
    const color = cssColorToOklch(source);
    accentCache.set(source, {
      light: accentTone(color, ACCENT_LIGHTNESS.light),
      dark: accentTone(color, ACCENT_LIGHTNESS.dark),
    });
  }
  return accentCache.get(source);
}

// CSS custom properties for a flavor pill (.product-card__flavor in index.css)
export function accentStyle(flavor) {
  const { light, dark } = flavorAccent(flavor);
  return { "--accent": light, "--accent-dark": dark };
}

// Star fill: must read as "filled" against the card, so it's always clearly darker than the card: the
// pill tone in light mode unless that's too close to the card (yellows), and a rich deep tone in dark mode.
const STAR_GAP = 0.16;
const STAR_DARK_LIGHTNESS = 0.5;
const starCache = new Map();

export function flavorStarColor(flavor) {
  const source = flavorColor(flavor);
  if (!starCache.has(source)) {
    const { c, h } = cssColorToOklch(source);
    const tone = (l) => formatOklch({ l, c: Math.min(c, ACCENT_MAX_CHROMA, maxChroma(l, h) * 0.95), h });
    const pillL = parseOklch(flavorAccent(flavor).light).l;
    starCache.set(source, {
      light: tone(Math.min(pillL, LIGHTNESS.light - STAR_GAP)),
      dark: tone(STAR_DARK_LIGHTNESS),
    });
  }
  return starCache.get(source);
}

// CSS custom properties for stars (.stars in index.css)
export function starStyle(flavor) {
  const { light, dark } = flavorStarColor(flavor);
  return { "--star": light, "--star-dark": dark };
}

// Hard-edged diagonal bands, one per flavor (a single flavor is a solid fill). Not a smooth gradient.
export function flavorBands(flavors, mode) {
  const colors = (flavors.length ? flavors : ["plain"]).map((f) => flavorSurface(f)[mode]);
  if (colors.length === 1) return colors[0];
  const step = 100 / colors.length;
  const stops = colors.map((col, i) => `${col} ${(i * step).toFixed(2)}% ${((i + 1) * step).toFixed(2)}%`);
  return `linear-gradient(115deg, ${stops.join(", ")})`;
}

// CSS custom properties for an element with the "flavor-surface" class (see index.css)
export function flavorStyle(flavors) {
  return {
    "--surface-bg": flavorBands(flavors, "light"),
    "--surface-bg-dark": flavorBands(flavors, "dark"),
  };
}
