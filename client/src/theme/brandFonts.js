// A display font per brand for the brand name on cards, loosely in the spirit of each brand's logo
// (style only: we never use logos themselves, CLAUDE.md hard rule 10). All Google Fonts (OFL).
// The browser downloads a font file only when text on screen uses it.
//
// To change a brand's font, edit its line. weight defaults to 400; italic is optional.

export const BRAND_FONTS = {
  aha: { family: "Fredoka", weight: 700 },
  aprch: { family: "Josefin Sans", weight: 600 },
  ardor: { family: "Cormorant Garamond", weight: 700 },
  "aura-bora": { family: "Shrikhand" },
  baloo: { family: "Baloo 2", weight: 800 },
  bonsai: { family: "Zen Maru Gothic", weight: 700 },
  "bubbl'r": { family: "Bungee" },
  bubly: { family: "Varela Round" },
  "daypack-athletic-brewing": { family: "Bebas Neue" },
  dram: { family: "IM Fell English" },
  gerolsteiner: { family: "Libre Baskerville", weight: 700 },
  "good-&-gather": { family: "DM Sans", weight: 700 },
  "good-idea": { family: "Work Sans", weight: 700 },
  heywell: { family: "Quicksand", weight: 700 },
  "hi-ball-energy": { family: "Lobster" },
  "ice-mountain": { family: "Oswald", weight: 700 },
  "icelandic-glacial": { family: "Raleway", weight: 600 },
  just: { family: "Montserrat", weight: 800 },
  kimino: { family: "M PLUS Rounded 1c", weight: 800 },
  "la-croix": { family: "Pacifico" },
  "liquid-death": { family: "UnifrakturMaguntia" },
  nixie: { family: "Comfortaa", weight: 700 },
  origin: { family: "Lora", weight: 700 },
  path: { family: "Archivo Black" },
  perrier: { family: "Playfair Display", weight: 900, italic: true },
  phocus: { family: "Space Grotesk", weight: 700 },
  "polar-seltzer": { family: "Righteous" },
  present: { family: "Cormorant", weight: 700 },
  puraqua: { family: "Poppins", weight: 700 },
  recess: { family: "DM Serif Display" },
  "san-pellegrino": { family: "Cinzel", weight: 700 },
  sanzo: { family: "Rubik", weight: 800 },
  saratoga: { family: "Playfair Display SC", weight: 700 },
  soleil: { family: "Courgette" },
  sovany: { family: "Josefin Slab", weight: 700 },
  "sparkling-ice": { family: "Russo One" },
  spindrift: { family: "Spectral", weight: 700 },
  "splash-fizz": { family: "Bubblegum Sans" },
  "topo-chico": { family: "Rye" },
  "trader-joes": { family: "Alfa Slab One" },
  tru: { family: "Lexend", weight: 700 },
  "untitled-art": { family: "Space Mono", weight: 700 },
  waterloo: { family: "Outfit", weight: 800 },
  "wild-wonder": { family: "Chewy" },
};

// Brands not listed (new ones) use the site's display font
const FALLBACK = { family: "Lilita One" };

export function brandFont(brandName) {
  return BRAND_FONTS[String(brandName || "").trim().toLowerCase()] || FALLBACK;
}

// Inline style for a brand name
export function brandFontStyle(brandName) {
  const { family, weight = 400, italic = false } = brandFont(brandName);
  return { fontFamily: `"${family}", "Lilita One", sans-serif`, fontWeight: weight, fontStyle: italic ? "italic" : "normal" };
}

// One Google Fonts stylesheet URL covering every brand font (only used glyph files get downloaded)
export function brandFontsStylesheetUrl() {
  const families = new Map();
  for (const { family, weight = 400, italic = false } of Object.values(BRAND_FONTS)) {
    const key = family;
    if (!families.has(key)) families.set(key, new Set());
    families.get(key).add(`${italic ? 1 : 0},${weight}`);
  }
  const params = [...families.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([family, variants]) => {
      const name = family.replace(/ /g, "+");
      const list = [...variants].sort();
      const onlyRegular = list.length === 1 && list[0] === "0,400";
      return onlyRegular ? `family=${name}` : `family=${name}:ital,wght@${list.join(";")}`;
    });
  return `https://fonts.googleapis.com/css2?${params.join("&")}&display=swap`;
}

// Adds the stylesheet to the page once (called from main.jsx)
export function loadBrandFonts() {
  if (typeof document === "undefined" || document.getElementById("brand-fonts")) return;
  const link = document.createElement("link");
  link.id = "brand-fonts";
  link.rel = "stylesheet";
  link.href = brandFontsStylesheetUrl();
  document.head.appendChild(link);
}
