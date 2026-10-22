# Image audit (P1-0)

_2026-10-22. Data from `bubblydatabase3_staging` (a copy of production restored the same day), via
`node server/scripts/imageAudit.js` (read-only, never fetches images). Rules: CLAUDE.md hard rules 10–11._

## Summary

- **All 442 products show a third-party image, hotlinked from 74 other people's servers.** None are
  ours. None are missing, all use https, and no two products share a URL.
- **All 43 brand logos** (`client/src/assets/brandLogos.json`) are hotlinked too, from 24 hosts.
- The site's own decorative images have **unknown provenance**; Thomas to confirm.
- Nothing needs deleting. The fix is to stop *showing* these and render typographic cards instead.

## Product images (`BubblyWater.imageURL`)

| Source type | Products | Hosts | Examples | Risk |
|---|---:|---:|---|---|
| Brand-owned sites | 211 | 29 | lacroixwater.com, sparklingice.com, aurabora.com, maisonperrier.fr | Brand's copyright; hotlinking without permission; breaks when they redesign |
| Retailers / delivery apps | 109 | 25 | walmartimages, kroger, albertsons, shipt, traderjoes, target, instacart | Retailer's (or brand's) copyright; retailer terms usually forbid reuse |
| **Amazon** | **70** | 1 | m.media-amazon.com | **Highest.** The Associates agreement forbids using Amazon images outside its API (hard rule 11), and doing so could get a future affiliate account closed |
| Generic CDNs (owner unclear) | 40 | 12 | cdn.sanity.io, cdn.shopify.com, cloudfront, squarespace | Unknown owner |
| Google image-search thumbnails | 6 | 1 | encrypted-tbn0.gstatic.com | Google's cached copies of someone else's image; can vanish any time |
| Blogs / media / press | 6 | 6 | refinery29, verywellfit, prnewswire, personal blogs | Photographer's copyright |

Classification: **own 0 · user uploads 0 · third-party hotlink 442.** The full per-host list is in the
script output.

The same URLs also live in `server/seeders/bubblyWaterSeeds.json` and `newSeeds.json` (seed data in the
repo). They aren't rendered from there; they're just copies of the data.

## Brand logos (`client/src/assets/brandLogos.json`)

43 entries of `{ name, link, site }`. `link` (the logo image) is hotlinked from 24 hosts, including
Google thumbnails (7), Wikimedia (6), Amazon (4), Twitter (2), LinkedIn, and logo-collection sites
(1000logos.net, logos-world.net). Under hard rule 10, logos aren't used at all. `site` (the brand's
official URL) is fine to keep as a text link.

## Where the client renders them

| File | What |
|---|---|
| `client/src/components/BubblyWaterListItem.jsx:43` | product image in every list (home top 50, flavor, caffeine, CBD lists) |
| `client/src/pages/BubblyWater.jsx:265` | product page image |
| `client/src/pages/SearchResults.jsx:68` | search result thumbnails |
| `client/src/components/RecentReviews.jsx:17` | recent reviews |
| `client/src/components/UsersRatings.jsx:20` | profile → ratings |
| `client/src/components/UsersReviews.jsx:24` | profile → reviews |
| `client/src/pages/AllBrands.jsx:19` | brand logo grid |
| `client/src/pages/Brand.jsx:49` | brand page logo |

`client/utils/queries.js` requests `imageURL` in 17 queries, and `mutations.js` in 1.

## The site's own images (provenance unknown)

| File | Used by | Note |
|---|---|---|
| `client/public/bubblesicon.png` | favicon, navbar, error page | Who made it? |
| `client/src/assets/whitebubbles.jpg`, `blackbubbles.jpg` | `Logo` on the home page (background texture) | The README credits a "Polkadot Header from SongPixels (depositphotos)": a stock photo needs a license |
| `client/public/bubblesbackground.webp` | (no references found) | Probably unused |
| `client/public/vite.svg` | (none) | Vite template leftover |
| `client/src/components/Header.jsx` | **not rendered anywhere** | Dead code; hotlinks the Tailwind UI placeholder logo |

The Google Font (Lilita One) is OFL-licensed: fine.

## Proposal

No data is deleted (hard rule 3). `imageURL` stays in the database and in the GraphQL schema; the
client just stops displaying it. Suggested tickets, each one session:

1. **Brand color tokens** (≈45m). One OKLCH color (light + dark values) per brand in the theme file,
   next to the flavor colors (CLAUDE.md conventions). Brands without a hand-picked color get a
   deterministic fallback from a small palette, so a new brand never breaks a card.
2. **`<ProductCard>` typographic component** (≈60m). Brand color + flavor name + brand name + score as
   the anchor, plus our own flavor-category icon (CLAUDE.md conventions). Accessible: real text, AA
   contrast on each brand color, visible focus. Used in list items first.
3. **Swap every product image for the card** (≈45m). The 6 product render sites above. Stop
   requesting `imageURL` in client queries. **The 70 Amazon images go away in this step**, so it's the
   one to prioritize.
4. **Brands without logos** (≈30m). The brand page and the All Brands grid become typographic (brand
   name in its color). Drop `link` from `brandLogos.json` (keep `site`), and delete dead `Header.jsx`.
5. **Own assets** (Thomas, ≈15m). Confirm where `bubblesicon.png` and the bubble textures came from.
   If the license is unknown, replace them in Phase 4 (designer brief); remove `vite.svg` and the
   unused webp.
6. **Later, with approval only:** a reversible migration renaming `imageURL` → `legacyImageURL`, so
   it's never mistaken for an approved image again. Not needed to ship.

**Interaction with P1-1 (CSP):** until step 3 ships, the Content-Security-Policy has to allow images
from any https host (`img-src 'self' data: https:`). After steps 3–4 it can tighten to
`img-src 'self' data:`, which also enforces hard rule 10 in the browser.

**Going forward:** the Phase 2 submission form shouldn't have an "image URL" field. Only uploads with a
license grant (or our own photos) can add images.
