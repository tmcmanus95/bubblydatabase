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

// Base colors that read wrong once they're vivid: CSS "pink" turns into raspberry, so watermelon gets
// real watermelon flesh. Used by every palette except "aura".
const VIBRANT_BASES = { watermelon: "#ff5c7a" };

// The flavor's base color: a Color Lab / settings override, else flavorColors.js
const baseColor = (flavor) => {
  const key = String(flavor || "").trim().toLowerCase().replace(/\s+/g, "-");
  const { flavorOverrides, palette } = getColorSettings();
  return flavorOverrides[key] || (palette !== "aura" && VIBRANT_BASES[key]) || flavorColor(flavor);
};

const tone = ({ c, h }, l, cap) => formatOklch({ l, c: Math.min(c, cap, maxChroma(l, h) * 0.95), h });

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

// { light, dark } background colors for one flavor. "aura": one lightness for every flavor. "vibrant" and
// "white": each flavor at its own most vivid lightness, with a chroma boost.
export function flavorSurface(flavor) {
  const { palette, card, vibrant } = getColorSettings();
  const source = baseColor(flavor);
  const cache = cacheFor("surface");
  const cacheKey = `${palette}:${source}`;
  if (!cache.has(cacheKey)) {
    const color = cssColorToOklch(source);
    if (palette === "aura") {
      cache.set(cacheKey, {
        light: tone(color, card.light.lightness, card.light.maxChroma),
        dark: tone(color, card.dark.lightness, card.dark.maxChroma),
      });
    } else {
      const boosted = { ...color, c: color.c * vibrant.chromaBoost };
      cache.set(cacheKey, {
        light: pillTone(boosted, vibrant.light, vibrant.maxChroma, "darkest"),
        dark: pillTone(boosted, vibrant.dark, vibrant.maxChroma, "darkest"),
      });
    }
  }
  return cache.get(cacheKey);
}

// { light, dark } vivid tones of one flavor for pills and the score badge
export function flavorAccent(flavor) {
  const source = baseColor(flavor);
  const cache = cacheFor("accent");
  if (!cache.has(source)) {
    const { pill, palette } = getColorSettings();
    const color = cssColorToOklch(source);
    if (palette === "vibrant" || palette === "soda" || palette === "sparkle") {
      // The card is already the vivid tone, so pills and the badge are a lighter version of it
      const card = flavorSurface(flavor);
      const lighter = (c) => {
        const { l, h } = parseOklch(c);
        return tone({ c: pill.maxChroma, h }, Math.min(0.97, l + 0.1), pill.maxChroma);
      };
      cache.set(source, { light: lighter(card.light), dark: lighter(card.dark) });
    } else if (palette === "white" || palette === "splash" || palette === "fizz") {
      // On a white card the pills and badge carry the flavor's full vivid tone
      cache.set(source, { ...flavorSurface(flavor) });
    } else {
      cache.set(source, {
        light: pillTone(color, pill.light, pill.maxChroma, "darkest"),
        dark: pillTone(color, pill.dark, pill.maxChroma, "lightest"),
      });
    }
  }
  return cache.get(source);
}

// Lemon-yellow hues turn olive when darkened; deep yellows lean toward gold instead (only outside "aura",
// whose tones Thomas already approved)
const goldenYellow = (color) => {
  const { l, c, h } = parseOklch(color);
  if (getColorSettings().palette === "aura" || h < 95 || h > 118 || l > 0.86) return color;
  return formatOklch({ l, c: Math.min(c * 1.15, maxChroma(l, 85) * 0.95), h: 85 });
};

const STAR_MAX_CHROMA = 0.27;

// { light, dark } star fill: the pill tone in light mode unless that's too close to the card (yellows), and
// a rich deep tone in dark mode, where cards are brighter
export function flavorStarColor(flavor) {
  const source = baseColor(flavor);
  const cache = cacheFor("star");
  if (!cache.has(source)) {
    const { pill, star, palette } = getColorSettings();
    const color = cssColorToOklch(source);
    const pillL = parseOklch(flavorAccent(flavor).light).l;
    const cardL = parseOklch(flavorSurface(flavor).light).l;
    if (palette === "aura") {
      cache.set(source, {
        light: tone(color, Math.min(pillL, cardL - star.lightModeGapBelowCard), pill.maxChroma),
        dark: tone(color, star.darkLightness, pill.maxChroma),
      });
    } else {
      // Vivid palettes: the most colorful tone a little darker than the card (darkening at a fixed amount
      // turned yellows and oranges brown). White-topped cards look the same on a dark page, so both modes
      // match there.
      const vivid = goldenYellow(
        pillTone({ ...color, c: STAR_MAX_CHROMA }, { minLightness: cardL - 0.32, maxLightness: cardL - 0.18 }, STAR_MAX_CHROMA, "lightest")
      );
      const dark = palette === "vibrant" ? tone(color, star.darkLightness, STAR_MAX_CHROMA) : vivid;
      cache.set(source, { light: vivid, dark });
    }
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
  const vivid = getColorSettings().palette !== "aura";
  const lighter = Math.min(0.97, l + (vivid ? 0.08 : 0.06));
  return formatOklch({ l: lighter, c: vivid ? Math.min(c, maxChroma(lighter, h) * 0.9) : c * 0.6, h });
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

// Waves are drawn 800 units wide with a wave shape that repeats every 200 units, shown at twice the
// card's width. Sliding a layer sideways by a multiple of the card width therefore loops seamlessly
// (the hover drift in index.css relies on this).
const WAVE_WIDTH = 800;
const WAVE_PERIOD = 200;

// A wavy edge around height y that fills everything below it
const wave = (y) => {
  let d = `M0 ${y}`;
  for (let x = 0; x < WAVE_WIDTH; x += WAVE_PERIOD) d += ` C ${x + 70} ${y - 22}, ${x + 130} ${y + 22}, ${x + 200} ${y}`;
  return `${d} V200 H0 Z`;
};

const svgLayer = (content) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WAVE_WIDTH} 200" preserveAspectRatio="none">${content}</svg>`
  )}") 0 0 / 200% 100% repeat-x`;

// The card background for a mode, in the pattern chosen in colorSettings.js. Every pattern only
// rearranges the same card tones, so readability is the same in all of them.
// Wave layers top to bottom: one per flavor, or a flavor and its tint.
const waveLayers = (colors) => (colors.length > 1 ? colors : [colors[0], tint(colors[0])]);

// Two tiles of tiny bubbles (small and close, bigger and sparser) that repeat in both directions, so
// they can rise forever on hover. Sizes in px; every circle stays inside its tile.
const BUBBLE_TILES = [
  { w: 96, h: 120, circles: [[18, 20, 2.4], [62, 52, 3.2], [34, 86, 2.6], [80, 104, 2.2]] },
  { w: 150, h: 160, circles: [[40, 30, 4.6], [112, 92, 5.6], [70, 136, 4]] },
];
// Circle j takes colors[j % colors.length]
const bubbleTile = ({ w, h, circles }, colors) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${circles
      .map(([cx, cy, r], j) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${colors[j % colors.length]}"/>`)
      .join("")}</svg>`
  )}") 0 0 / ${w}px ${h}px repeat`;

// "white" palette: a white sticker (in dark mode too) with one thin wave line per flavor, stacked like
// ribbons through the pill row (the pills float on it), in each flavor's deep tone; the bubbles below mix
// all the flavors' colors.
const PAPER = "oklch(0.99 0.004 90)";
const WHITE_BUBBLE = "#ffffff";
const WHITE_LINE_TOP = 120;
const WHITE_LINE_GAP = 8;
const whiteLineColors = (flavors) => (flavors.length ? flavors : ["plain"]).map((f) => oklchToHex(flavorStarColor(f).light));

// Tiny bubbles in the bottom wave region, in the color of the flavor above it (a one-flavor card's
// bubbles use the flavor on its lighter tint). Only for the waves pattern; drawn by
// .flavor-surface--waves::before in index.css, which starts just below the lowest wave.
export function flavorBubbles(flavors, mode) {
  const { pattern, palette } = getColorSettings();
  if (pattern !== "waves") return {};
  if (palette === "soda" || palette === "sparkle") {
    // Bubbles across the whole card: white, except soda cards with several flavors, whose bubbles are the
    // other flavors' deep tones (the first flavor is the background)
    const list = flavors.length ? flavors : ["plain"];
    const colors = palette === "soda" && list.length > 1 ? list.slice(1).map((f) => oklchToHex(flavorStarColor(f).light)) : [WHITE_BUBBLE];
    const bg = BUBBLE_TILES.map((t, i) => bubbleTile(t, colors.slice(i % colors.length).concat(colors.slice(0, i % colors.length)))).join(", ");
    return { ...pair("bubbles", { light: bg, dark: bg }, mode), "--bubbles-top": "0%", "--bubbles-fade": "18%" };
  }
  if (palette === "fizz") {
    // No waves: the bubbles fill the whole card, mixing every flavor's color
    const colors = whiteLineColors(flavors);
    const bg = BUBBLE_TILES.map((t, i) => bubbleTile(t, colors.slice(i % colors.length).concat(colors.slice(0, i % colors.length)))).join(", ");
    return { ...pair("bubbles", { light: bg, dark: bg }, mode), "--bubbles-top": "0%", "--bubbles-fade": "18%" };
  }
  if (palette === "splash") {
    const { accents } = splashColors(flavors);
    const bg = BUBBLE_TILES.map((t, i) => bubbleTile(t, accents.slice(i % accents.length).concat(accents.slice(0, i % accents.length)))).join(", ");
    // Compact cards are too short for the white top: they're all water (index.css)
    return {
      ...pair("bubbles", { light: bg, dark: bg }, mode),
      "--bubbles-top": `${SPLASH_TOP / 2 + 8}%`,
      "--surface-fill": splashColors(flavors).fill,
      "--compact-bubbles-top": "0%",
    };
  }
  if (palette === "white") {
    const colors = whiteLineColors(flavors);
    const bg = BUBBLE_TILES.map((t, i) => bubbleTile(t, colors.slice(i % colors.length).concat(colors.slice(0, i % colors.length)))).join(", ");
    const top = (WHITE_LINE_TOP + (colors.length - 1) * WHITE_LINE_GAP) / 2 + 7;
    return { ...pair("bubbles", { light: bg, dark: bg }, mode), "--bubbles-top": `${top}%` };
  }
  const tones = (m) => {
    const layers = waveLayers((flavors.length ? flavors : ["plain"]).map((f) => flavorSurface(f)[m]));
    const color = oklchToHex(layers[layers.length - 2]);
    return { top: (100 * (layers.length - 1)) / layers.length + 6, bg: BUBBLE_TILES.map((t) => bubbleTile(t, [color])).join(", ") };
  };
  const light = tones("light");
  return { ...pair("bubbles", { light: light.bg, dark: tones("dark").bg }, mode), "--bubbles-top": `${light.top}%` };
}

// Just the wavy line at height y (no fill), drawn at a constant thickness however the card stretches it
const waveLine = (y, color) =>
  `<path d="${wave(y).replace(" V200 H0 Z", "")}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;

// "splash" palette: white on top; below a wave the card fills with the first flavor's vivid color. The
// wave's edge line and the bubbles are the other flavors' deep tones (a one-flavor card uses its own deep
// tone), with one extra line per further flavor stacked above the edge.
const SPLASH_TOP = 116;
const splashColors = (flavors) => {
  const list = flavors.length ? flavors : ["plain"];
  const others = list.length > 1 ? list.slice(1) : list;
  return { fill: oklchToHex(flavorSurface(list[0]).light), accents: others.map((f) => oklchToHex(flavorStarColor(f).light)) };
};
const splashBackground = (flavors) => {
  if (getColorSettings().pattern !== "waves") return PAPER;
  const { fill, accents } = splashColors(flavors);
  const layers = [svgLayer(`<path d="${wave(SPLASH_TOP)}" fill="${fill}"/>${waveLine(SPLASH_TOP, accents[0])}`)];
  accents.slice(1).forEach((color, i) => layers.unshift(svgLayer(waveLine(SPLASH_TOP - (i + 1) * WHITE_LINE_GAP, color))));
  return `${layers.join(", ")}, ${PAPER}`;
};

const whiteBackground = (flavors) => {
  if (getColorSettings().pattern !== "waves") return PAPER;
  const lines = whiteLineColors(flavors).map((color, i) => svgLayer(waveLine(WHITE_LINE_TOP + i * WHITE_LINE_GAP, color)));
  return `${lines.join(", ")}, ${PAPER}`;
};

export function flavorBackground(flavors, mode) {
  const list = flavors.length ? flavors : ["plain"];
  if (getColorSettings().palette === "white") return whiteBackground(list);
  if (getColorSettings().palette === "splash") return splashBackground(list);
  if (getColorSettings().palette === "fizz") return PAPER;
  // soda: the first flavor's vivid color fills the card. sparkle: a gradient of every flavor's vivid color
  // (one flavor fades into its lighter tint). Both stay bright on dark pages.
  if (getColorSettings().palette === "soda") return flavorSurface(list[0]).light;
  if (getColorSettings().palette === "sparkle") {
    const tones = list.map((f) => flavorSurface(f).light);
    const stops = tones.length > 1 ? tones : [tones[0], tint(tones[0])];
    return `linear-gradient(${getColorSettings().bandAngle}deg, ${stops.join(", ")})`;
  }
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
      // One background image per wave layer so layers can drift at different speeds on hover (index.css).
      const layers = waveLayers(colors);
      const hex = layers.map(oklchToHex);
      const heights = layers.map((_, i) => (200 * i) / layers.length);
      const images = layers.slice(1).map((_, k) => svgLayer(`<path d="${wave(heights[k + 1])}" fill="${hex[k + 1]}"/>`));
      // Lower waves cover upper ones, so list them first (the first background is drawn on top)
      return `${images.reverse().join(", ")}, ${layers[0]}`;
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
