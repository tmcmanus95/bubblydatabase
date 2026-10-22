# BubblyDB — Product & Technical Spec

## 1. Context

RateYourMusic-style sparkling water database. MERN stack. Live site with real users, ratings, reviews and product data. The whole point is to be **fun and silly**.

## 2. Hard constraints

- **Existing users, ratings, reviews and products must survive every change.**
- Every schema change ships as a reversible migration script, run first against a staging copy of prod, with a fresh `mongodump` taken immediately before running in prod.
- Avoid forcing password resets. If an auth change ever requires one (e.g., changing hash algorithm), use rehash-on-next-login instead; only fall back to a reset email if unavoidable, and tell users why.
- Monetization features wait until traffic justifies them (see §10).

## 3. Phase 0 — Safety net & audit

- DONE (Oct 21): manual mongodump of prod saved off-repo; staging database
  "bubblydatabase3_staging" restored from it (users 45, bubblywaters 442, ratings 1350,
  reviews 159); local .env points to staging with a staging-only DB user.
- TODO: automated daily backup off-site with a tested restore; `npm run staging:refresh`
  script; a staging Render service on the staging branch.
- Known: `ratings` and `reviews` have no indexes; an empty `bubblydatabase3` collection exists.- Audit → `docs/AUDIT.md`: routes, models, indexes, every nested-loop/N+1 hotspot, `npm audit` results, secrets handling, auth flow, where images come from.
- Smoke tests for core flows: signup, login, search, rate, review, product page.

## 4. Phase 1 — Security + quick wins

**Security baseline**

- `helmet`, strict CORS (your domain only), `express-rate-limit` (global + tighter limits on login/signup/password reset/rating/review endpoints), request body size limits.
- Input validation on every route (zod/joi); `express-mongo-sanitize` to block NoSQL operator injection; escape/sanitize review text on render.
- Passwords: bcrypt/argon2 with sane cost; account lockout/backoff after repeated failed logins.
- Sessions/JWT in `httpOnly`, `Secure`, `SameSite` cookies (not localStorage); short expiry + refresh.
- Admin routes behind role checks on the server (never only hidden in UI).
- Bot friction on signup: honeypot field + Cloudflare Turnstile (privacy-friendly CAPTCHA alternative).
- Secrets in env vars only; rotate anything that was ever committed.
- Error handling that doesn't leak stack traces; basic request logging + uptime monitoring.

## 4.5 Phase 1.5 — Affiliate-ready

- `offers` array on products: retailer, asin, url, affiliateUrl, network, packSize, active,
  lastChecked, status.
- `/go/:productId/:offerId` redirect: logs clicks; Amazon links built from ASIN +
  AMAZON_ASSOCIATE_TAG env var (empty until approved); others use affiliateUrl ?? url.
- Reusable disclosure component, shown only when a tagged offer is active; Amazon's required
  statement included.
- Weekly link health check. Awards/badges must never reward clicking or buying.

**Quick wins**

- **Remove email verification as a gate for rating.** Replace with abuse controls: per-account rating rate limits, new-account throttling, and the option to exclude very new/unverified accounts from "controversial"/leaderboard calculations. Keep verification required for written reviews and product submissions.
- **Search routing bug:** one search page, state in URL query params (`/search?q=&flavor=&caffeine=0&cbd=0&sort=`). Flavor pages become redirects to `/search?flavor=x`. Results always render in-page under the search bar; URLs are shareable.
- **Rating component:** replace MUI drag rating with a custom component: pointer events (works for mouse/touch/pen), immediate visual update on pointer move, commit on release, optimistic save with rollback on error, half-star support if you use it, full keyboard support (arrow keys) and ARIA `slider` semantics.
- **Data processing:** replace nested loops with `Map`/`Set` lookups; push aggregation into MongoDB (`$group`, `$lookup`) instead of JS; add indexes for search/filter/sort fields; store denormalized `avgRating`, `ratingCount`, `reviewCount` on products, updated on write (plus a nightly recompute job as a safety net).

## 5. Phase 2 — Catalog tooling (kills the maintenance burden)

- **Admin UI:** CRUD for products, brands, flavors, tags/attributes; image upload; bulk edit; audit log of admin edits.
- **User submissions:** verified users submit new products or edits through a validated form (brand, name, flavors, caffeine, CBD, sweetener, size, UPC optional, source URL). Statuses: `pending → approved | changes_requested (with admin note) | rejected (with reason)`. Admin sees a diff for edits to existing products. Submitter gets notified.
- **Bi-weekly AI news sweep:** scheduled job searches defined sources (brand sites, press releases, food/beverage news, retailer "new arrivals"), compares against the DB, and creates **draft submissions** tagged `source: ai-sweep` with source links. Never auto-publishes. Log what was checked so you can see if it's finding anything.
- **Images:** own the files. Store in object storage + CDN (e.g., Cloudflare R2 or S3 + CloudFront), served at your own URLs, resized to a few fixed sizes, with a flavor-color placeholder when missing. See §11 for licensing — migrate only images you have rights to use.

## 6. Phase 3 — Community

- **Upvotes** on ratings/reviews and on lists: a `Vote` collection `{user, targetType, targetId}` with a unique compound index (prevents double votes); denormalized counts on targets.
- **Lists:** name, description, ordered items each with optional note; public/private; upvotable; list pages + "Lists" in header nav.
- **Community page** (header link) with tabs:
  - Bubblies: Popular now (ratings in last 14 days), New arrivals, Top rated, Lowest rated, Most controversial.
  - Reviews: New, Popular (upvotes, time-decayed), Hot takes (rating far from the product's average and upvoted).
  - Lists: New, Popular.
  - Definitions: "controversial" = high rating standard deviation with a minimum rating count; "popular now" uses time decay so the page changes.
- **Awards/badges** via nightly job: Top Rater (month), Most Upvoted Review, Flavor Explorer (rated N distinct flavors), Streaks, First to Rate a new bubbly. Show on profiles; keep them silly.
- **Filters:** facet sidebar/chips: caffeine, CBD, sweetened/unsweetened, multiple flavors (AND/OR), brand, "available on site/affiliate", rating range. Model these as boolean/tag attributes on products so new filters don't need code.

## 7. Phase 4 — Look & feel (true north: Aura Bora's playfulness, but your own identity)

- **Design tokens:** colors, radii, shadows, motion in one theme file.
- **Flavor colors in dark mode:** define each flavor in OKLCH with separate light/dark values (adjust lightness/chroma per mode) rather than one hex for both. Run a contrast check (WCAG) on text over each color.
- **Glowing animated borders** on main-page bubbly icons: CSS conic-gradient border using the flavor's colors, animated via `@property --angle`. GPU-cheap, no JS. Respect `prefers-reduced-motion`. Use sparingly (hover, featured, top-rated) so it reads as delight, not "AI dashboard."
- **Less clinical, not AI-generated:** illustrated elements (hand-drawn bubbles, a mascot, wobbly/organic shapes, sticker-style badges), a characterful display font paired with a readable body font, warm textured backgrounds, playful microcopy ("Fizz level"), little moments (bubbles rising on a 5-star rating). Avoid: generic gradient meshes everywhere, glassmorphism cards, stock icon sets.
- **Designer brief** (logo + banner + small illustration set): playful, hand-made, flavor palette, must work at favicon size and as a social avatar. Commission the illustration set too — it's what will make the site feel like yours.
- **History of Bubbly Water:** `/history`, written with your sister, tongue-in-cheek timeline. Link from footer and an easter egg (e.g., clicking the mascot). Content in markdown so she can edit it.

## 8. Phase 5 — Ship-ready (legal & accessibility)

_Not legal advice — use a template service for drafts and have a lawyer review once there's revenue._

- Terms of Service (user content license, conduct rules, termination, disclaimers), Privacy Policy (what you collect, cookies, third parties, deletion requests), content/moderation policy, DMCA/takedown contact.
- Minimum age 13+ in ToS (COPPA).
- Cookies: if only essential auth cookies, a notice in the privacy policy is usually enough in the US. Ads/analytics trackers change that — a consent banner (and Google-certified CMP for EU/UK traffic with AdSense) becomes required.
- FTC disclosure on affiliate links and clearly labeled "Sponsored"/"Featured" placements.
- Accessibility target WCAG 2.2 AA: keyboard navigation, focus states, alt text, contrast, reduced motion. Publish an accessibility statement.
- Account deletion + data export flow.

## 9. Phase 6 — Growth & monetization (after traffic)

- **Affiliate:** Amazon Associates first (easiest; note it closes accounts that don't make qualifying sales within the first ~180 days, so apply once traffic exists). Then brand programs through affiliate networks (Impact, Awin, ShareASale) — many DTC drink brands run them.
- **Ads:** AdSense is the easy start; premium networks (Mediavine, Raptive) have traffic minimums. Ads hurt a fun site's vibe — consider affiliate + sponsorship only until traffic is large.
- **Featured bubbly:** paid, time-boxed, clearly labeled slot. Price manually at first.
- **Brand accounts:** "claim this brand" with verification, edit brand page, respond to reviews. Only build when a brand asks.
- **Partner prospecting (AI-assisted):** monthly job builds a lead list (small/new DTC brands from the sweep, with contact pages) into a sheet; you write and send outreach yourself.

## 10. Answers to Thomas's questions

**Photo licensing (not legal advice).** Product photos are copyrighted by whoever shot them; hotlinking Amazon images also breaks Amazon's terms unless served through their affiliate API. Options, safest first:

1. Shoot your own (white backdrop, same setup each time) — doubles as taste-test video content.
2. Ask brands for press-kit images (most will say yes to a free listing; keep the emails).
3. Amazon product images via the official Associates API once you qualify.
4. A house illustration style (flavor-colored can icons) as the default, photos as upgrades.
   Logos/brand names: using them to identify the product (nominative use) is generally fine; don't imply endorsement or alter logos. Fonts: check each font's license; Google Fonts/OFL are safe for web.

**Maintenance with affiliate/ads.** Low once Phase 2 tooling exists: link health checks (automated), a monthly payout/report check, and the bi-weekly sweep review (~15 min). The real ongoing cost is content and socials, not the site.

**Maximizing success at 15–60 min/day.**

- One ticket per session; Claude Code does the build, you review.
- Alternate days: build vs. content. Traffic is the constraint.
- Pick one social platform to start (short vertical video reuses across TikTok/Reels/Shorts). Ride trends: viral bubbly moments, weird limited flavors, "rating every LaCroix," the Guy Fieri lineup.
- Every video ends with "full ratings on [site]" and a link; every new rating on site becomes a clip.
- Post monthly "State of Bubbly" mini-reports from your own data (top rated, most controversial) — data content gets shared.
- Watch one metric: weekly active raters.

**Other enhancements worth considering:** SEO (server-rendered or pre-rendered product pages with structured data — big for discovery), Open Graph share images per product ("I rated this 4.5 ⭐"), weekly email digest, "where to buy" links, UPC/barcode scan on mobile, flavor-profile recommendations ("if you like X, try Y"), embeddable rating widgets for brands.

## 11. Name ideas (check domains + trademarks)

Fizzbase · The Fizz Index · Fizzcritic · Seltzer Society · Carbonation Station · Spritzlist · Effervescence · Bubble Ranked · Pop & Fizz · Fizzology · Bubbly Board · Sparkle Score · Rate My Fizz. (Avoid riffs on Letterboxd/RateYourMusic names — trademark risk.)

## 12. Risks

| Risk                                   | Mitigation                                                                |
| -------------------------------------- | ------------------------------------------------------------------------- |
| Data loss during migrations            | Daily backups, staging rehearsal, reversible migrations                   |
| Spam ratings after removing email gate | Rate limits, new-account throttling, Turnstile, exclusion from aggregates |
| Copyright complaints over images       | Own/permissioned images; takedown contact                                 |
| Scope creep stalls shipping            | Phases are sequential; Phase 6 waits for traffic                          |
| AI sweep adds bad data                 | Drafts only; human approval required                                      |
