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
