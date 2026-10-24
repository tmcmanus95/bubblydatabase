// Color math for the theme: OKLCH → sRGB, gamut check, and WCAG contrast.
// Conversion matrices from Björn Ottosson's OKLab definition.

// Parses "oklch(L C H)" with L in 0–1 (or a percentage), C as a number, H in degrees
export function parseOklch(value) {
  const match = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(value.trim());
  if (!match) throw new Error(`not an oklch() color: ${value}`);
  const l = Number(match[1]) / (match[2] ? 100 : 1);
  return { l, c: Number(match[3]), h: Number(match[4]) };
}

// Linear-light sRGB channels (may fall outside 0–1 when the color is out of gamut)
export function oklchToLinearSrgb({ l, c, h }) {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const L = l_ ** 3;
  const M = m_ ** 3;
  const S = s_ ** 3;

  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
}

// True when the color can be shown on a normal (sRGB) screen without clipping
export function inSrgbGamut(value, tolerance = 0.0005) {
  return oklchToLinearSrgb(parseOklch(value)).every((ch) => ch >= -tolerance && ch <= 1 + tolerance);
}

// WCAG relative luminance (0 = black, 1 = white)
export function relativeLuminance(value) {
  const [r, g, b] = oklchToLinearSrgb(parseOklch(value)).map((ch) => Math.min(1, Math.max(0, ch)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// WCAG contrast ratio between two colors (1–21). AA for normal text needs 4.5.
export function contrastRatio(a, b) {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// The few CSS color names used by flavor colors in App.css
const NAMED_COLORS = { greenyellow: "#adff2f", pink: "#ffc0cb", white: "#ffffff", black: "#000000" };

// "#rgb", "#rrggbb" or a known color name → { l, c, h } (OKLCH)
export function cssColorToOklch(value) {
  let hex = NAMED_COLORS[String(value).trim().toLowerCase()] || String(value).trim();
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) throw new Error(`unsupported color: ${value}`);
  if (hex.length === 4) hex = `#${[...hex.slice(1)].map((ch) => ch + ch).join("")}`;
  const toLinear = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = [1, 3, 5].map((i) => toLinear(parseInt(hex.slice(i, i + 2), 16) / 255));

  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const c = Math.hypot(A, B);
  const h = c < 1e-4 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return { l: L, c, h };
}

// Largest chroma at this lightness and hue that still fits in sRGB
export function maxChroma(l, h) {
  let lo = 0;
  let hi = 0.4;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inSrgbGamut(formatOklch({ l, c: mid, h }), 0)) lo = mid;
    else hi = mid;
  }
  return lo;
}

export function formatOklch({ l, c, h }) {
  return `oklch(${+l.toFixed(3)} ${+c.toFixed(3)} ${+h.toFixed(1)})`;
}

// oklch() string → "#rrggbb" (clipped to sRGB). For places that need plain hex, like inline SVG.
export function oklchToHex(value) {
  const encode = (v) => {
    const x = Math.min(1, Math.max(0, v));
    const s = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
    return Math.round(s * 255).toString(16).padStart(2, "0");
  };
  return `#${oklchToLinearSrgb(parseOklch(value)).map(encode).join("")}`;
}
