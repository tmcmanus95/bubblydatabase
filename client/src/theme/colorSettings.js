// Every knob for the card colors, in one place. Tweak these live at /working/colors (the Color Lab),
// then paste its "Copy settings" output over DEFAULT_COLOR_SETTINGS below.
//
// Colors are OKLCH: lightness 0 (black) → 1 (white); chroma 0 (gray) → ~0.37 (most vivid). Each flavor
// keeps its own hue; these settings decide how light and how vivid it gets in each role. Text stays the
// same dark ink everywhere, so `npm test` checks every flavor stays readable (WCAG AA) after a change.

export const DEFAULT_COLOR_SETTINGS = {
  // The card background (one band per flavor)
  card: {
    light: { lightness: 0.86, maxChroma: 0.17 },
    dark: { lightness: 0.72, maxChroma: 0.18 },
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
  pattern: "bands",
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
