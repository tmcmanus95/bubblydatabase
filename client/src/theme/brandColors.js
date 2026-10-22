// Brand color tokens for the typographic product cards (P1-0a).
//
// Each brand gets one color from our own palette: a light-mode background + text color and a
// dark-mode pair. These are our colors, not the brands' trade dress. Every pair is in the sRGB gamut
// and passes WCAG AA (≥ 4.5:1), checked by brandColors.test.js.
//
// To change a brand's color, edit its line in BRAND_COLORS. New brands get a stable automatic color.

export const BRAND_PALETTE = {
  coral: {
    light: { bg: "oklch(0.88 0.057 28)", ink: "oklch(0.3 0.07 28)" },
    dark: { bg: "oklch(0.42 0.1 28)", ink: "oklch(0.97 0.013 28)" },
  },
  tangerine: {
    light: { bg: "oklch(0.88 0.067 55)", ink: "oklch(0.3 0.067 55)" },
    dark: { bg: "oklch(0.42 0.094 55)", ink: "oklch(0.97 0.016 55)" },
  },
  apricot: {
    light: { bg: "oklch(0.88 0.09 80)", ink: "oklch(0.3 0.056 80)" },
    dark: { bg: "oklch(0.42 0.078 80)", ink: "oklch(0.97 0.02 80)" },
  },
  lemon: {
    light: { bg: "oklch(0.93 0.13 102)", ink: "oklch(0.3 0.057 102)" }, // yellows need extra lightness to read as yellow
    dark: { bg: "oklch(0.42 0.079 102)", ink: "oklch(0.97 0.02 102)" },
  },
  lime: {
    light: { bg: "oklch(0.88 0.09 130)", ink: "oklch(0.3 0.07 130)" },
    dark: { bg: "oklch(0.42 0.1 130)", ink: "oklch(0.97 0.02 130)" },
  },
  mint: {
    light: { bg: "oklch(0.88 0.09 160)", ink: "oklch(0.3 0.061 160)" },
    dark: { bg: "oklch(0.42 0.086 160)", ink: "oklch(0.97 0.02 160)" },
  },
  teal: {
    light: { bg: "oklch(0.88 0.09 190)", ink: "oklch(0.3 0.047 190)" },
    dark: { bg: "oklch(0.42 0.065 190)", ink: "oklch(0.97 0.02 190)" },
  },
  sky: {
    light: { bg: "oklch(0.88 0.071 225)", ink: "oklch(0.3 0.051 225)" },
    dark: { bg: "oklch(0.42 0.072 225)", ink: "oklch(0.97 0.017 225)" },
  },
  periwinkle: {
    light: { bg: "oklch(0.88 0.052 265)", ink: "oklch(0.3 0.07 265)" },
    dark: { bg: "oklch(0.42 0.1 265)", ink: "oklch(0.97 0.013 265)" },
  },
  lavender: {
    light: { bg: "oklch(0.88 0.059 295)", ink: "oklch(0.3 0.07 295)" },
    dark: { bg: "oklch(0.42 0.1 295)", ink: "oklch(0.97 0.014 295)" },
  },
  orchid: {
    light: { bg: "oklch(0.88 0.09 325)", ink: "oklch(0.3 0.07 325)" },
    dark: { bg: "oklch(0.42 0.1 325)", ink: "oklch(0.97 0.02 325)" },
  },
  bubblegum: {
    light: { bg: "oklch(0.88 0.065 355)", ink: "oklch(0.3 0.07 355)" },
    dark: { bg: "oklch(0.42 0.1 355)", ink: "oklch(0.97 0.015 355)" },
  },
};

const PALETTE_NAMES = Object.keys(BRAND_PALETTE);

// Every brand in the catalog as of 2026-10-22 (brandName values). Alphabetical neighbors get
// well-separated hues so the All Brands grid never puts two near-identical colors side by side.
export const BRAND_COLORS = {
  aha: "coral",
  aprch: "mint",
  ardor: "orchid",
  "aura-bora": "lemon",
  baloo: "periwinkle",
  bonsai: "tangerine",
  "bubbl'r": "teal",
  bubly: "bubblegum",
  "daypack-athletic-brewing": "lime",
  dram: "lavender",
  gerolsteiner: "apricot",
  "good-&-gather": "sky",
  "good-idea": "coral",
  heywell: "mint",
  "hi-ball-energy": "orchid",
  "ice-mountain": "lemon",
  "icelandic-glacial": "periwinkle",
  just: "tangerine",
  kimino: "teal",
  "la-croix": "bubblegum",
  "liquid-death": "lime",
  nixie: "lavender",
  origin: "apricot",
  path: "sky",
  perrier: "coral",
  phocus: "mint",
  "polar-seltzer": "orchid",
  present: "lemon",
  puraqua: "periwinkle",
  recess: "tangerine",
  "san-pellegrino": "teal",
  sanzo: "bubblegum",
  saratoga: "lime",
  soleil: "lavender",
  sovany: "apricot",
  "sparkling-ice": "sky",
  spindrift: "coral",
  "splash-fizz": "mint",
  "topo-chico": "orchid",
  "trader-joes": "lemon",
  tru: "periwinkle",
  "untitled-art": "tangerine",
  waterloo: "teal",
  "wild-wonder": "bubblegum",
};

// Stable palette pick for brands not listed above (FNV-1a hash of the name)
const fallbackColorName = (brandName) => {
  let hash = 0x811c9dc5;
  for (const char of brandName) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return PALETTE_NAMES[hash % PALETTE_NAMES.length];
};

export function brandColorName(brandName) {
  const key = String(brandName || "").trim().toLowerCase();
  return BRAND_COLORS[key] || fallbackColorName(key);
}

// The color token for a brand: { light: { bg, ink }, dark: { bg, ink } }
export function getBrandColor(brandName) {
  return BRAND_PALETTE[brandColorName(brandName)];
}

// CSS custom properties for an element with the "brand-surface" class (see index.css)
export function brandStyle(brandName) {
  const { light, dark } = getBrandColor(brandName);
  return {
    "--brand-bg": light.bg,
    "--brand-ink": light.ink,
    "--brand-bg-dark": dark.bg,
    "--brand-ink-dark": dark.ink,
  };
}
