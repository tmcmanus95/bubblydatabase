// Card colors from flavor colors (P1-0c follow-up): each flavor's hue at one fixed lightness per mode,
// so every flavor stays recognizable and the dark ink stays readable on all of them, including across
// the bands of multi-flavor cards. Dark mode uses slightly deeper but still bright tones (bright stickers
// on a dark page): darker tones turned yellows and oranges muddy olive/brown.
import { cssColorToOklch, formatOklch, maxChroma } from "./color.js";
import { flavorColor } from "./flavorColors.js";

const DARK_INK = "oklch(0.24 0.02 60)";
export const INK = { light: DARK_INK, dark: DARK_INK };

const LIGHTNESS = { light: 0.9, dark: 0.75 };
const MAX_CHROMA = { light: 0.13, dark: 0.15 };

const cache = new Map();

// { light, dark } background colors for one flavor
export function flavorSurface(flavor) {
  const source = flavorColor(flavor);
  if (cache.has(source)) return cache.get(source);
  const { c, h } = cssColorToOklch(source);
  const tone = (mode) => {
    const l = LIGHTNESS[mode];
    return formatOklch({ l, c: Math.min(c, MAX_CHROMA[mode], maxChroma(l, h) * 0.92), h });
  };
  const surface = { light: tone("light"), dark: tone("dark") };
  cache.set(source, surface);
  return surface;
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
