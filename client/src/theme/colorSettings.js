// Every knob for the card colors, in one place. Tweak these live at /working/colors (the Color Lab),
// then paste its "Copy settings" output over DEFAULT_COLOR_SETTINGS below.
//
// Colors are OKLCH: lightness 0 (black) → 1 (white); chroma 0 (gray) → ~0.37 (most vivid). Each flavor
// keeps its own hue; these settings decide how light and how vivid it gets in each role. Text stays the
// same dark ink everywhere, so `npm test` checks every flavor stays readable (WCAG AA) after a change.

export const DEFAULT_COLOR_SETTINGS = {
  // Overall color style: "aura" (soft, every flavor at the same lightness, like Aura Bora's cans),
  // "vibrant" (each flavor at its own natural, brighter lightness: lemons stay lemon-yellow) or "white"
  // (white card; only the wave lines and bubbles carry the flavor colors) or "splash" (white on top, the
  // first flavor's vivid color filling below the wave; edge line and bubbles in the other flavor) or "fizz"
  // (white card, no waves, bubbles in every flavor's color rising across the whole card), "soda" (fizz
  // inverted: the first flavor fills the card; white bubbles, or the other flavors' colors) or "sparkle"
  // (a gradient of the flavors' colors with white bubbles).
  palette: "soda", // picked by Thomas, 2026-10-23 (replaces "splash")
  // The card background (one band per flavor) for the "aura" palette
  card: {
    light: { lightness: 0.86, maxChroma: 0.17 },
    dark: { lightness: 0.72, maxChroma: 0.18 },
  },
  // The card background for the "vibrant" palette: each flavor takes the lightness where it can be most
  // vivid, kept within this range so the ink stays readable; chroma is boosted (x chromaBoost, capped).
  vibrant: {
    light: { minLightness: 0.74, maxLightness: 0.95 },
    dark: { minLightness: 0.7, maxLightness: 0.9 },
    maxChroma: 0.25,
    chromaBoost: 1.5,
  },
  // Flavor pills and the score badge. Each flavor picks the most vivid lightness in its range.
  pill: {
    light: { minLightness: 0.68, maxLightness: 0.84 },
    dark: { minLightness: 0.86, maxLightness: 0.94 },
    maxChroma: 0.22,
  },
  // Filled stars (and the hover shadow on light pages): always darker than the card so they read as filled
  star: {
    lightModeGapBelowCard: 0.16,
    darkLightness: 0.5,
  },
  // How multiple flavors share a card: "bands" (diagonal), "waves", "bubbles", "gradient" or "stripes".
  // Single-flavor cards are solid in "bands"/"gradient"/"stripes"; "waves" and "bubbles" add a lighter
  // tint of the flavor for texture.
  pattern: "waves", // picked by Thomas, 2026-10-23
  // Angle of the diagonal bands / gradient / stripes, in degrees
  bandAngle: 115,
  // Replace a flavor's base color for cards only, e.g. { lemon: "#fff200" }. Keys are flavor values
  // (lowercase, dashes). Without an entry, the color comes from flavorColors.js (mirrors App.css).
  flavorOverrides: {},
  // Replace a brand's border color, e.g. { spindrift: "#1b365d" }. Without an entry, it comes from
  // brandColors.js.
  brandColorOverrides: {},
};

let current = DEFAULT_COLOR_SETTINGS;
let version = 0;
const listeners = new Set();

export function getColorSettings() {
  return current;
}

// Bumps on every change; color helpers use it to drop their caches
export function colorSettingsVersion() {
  return version;
}

// Used by the Color Lab to try settings live (not saved anywhere)
export function setColorSettings(next) {
  current = next;
  version += 1;
  listeners.forEach((listener) => listener(version));
}

export function onColorSettingsChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
