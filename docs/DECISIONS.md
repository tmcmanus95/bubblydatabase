# Decisions

Newest first. Format: date · decision · why · who decided.

## 2026-10-22 · Brand package color as the card border
- Each brand's signature package color (green bottle for San Pellegrino/Perrier, black can for Liquid
  Death, clear/white for Topo Chico…) is the card border, ringed in ink. Chosen over a brand-name "tab"
  label. Colors in `brandColors.js`; Thomas gave some, approved Claude's guesses, may edit later.
- Background patterns (bands/waves/bubbles/gradient/stripes) are a setting; Thomas picked **waves** as
  the default (2026-10-23).
- Decided by: Thomas.

## 2026-10-22 · No flavor icons; tap-to-rate on cards
- The placeholder flavor icons are removed; the cards stand on their own. If icons return, they must be
  our own illustrated assets.
- P1-21: ratings happen by tapping the stars directly on cards, with safeguards against accidental
  ratings while scrolling (movement check, stars above the card link, undo toast).
- Decided by: Thomas.

## 2026-10-22 · Card layout B "Score sticker" + a Color Lab for tuning
- Picked from three mocked layouts (A tight stack, B score sticker, C side score): the score sits in a
  round badge filled with the flavor color, stars are centered along the bottom, tags go at the end of
  the pill row. Brand names auto-shrink to fit. The hover shadow takes a strong flavor color.
- All color knobs live in `colorSettings.js`; `/working/colors` tunes them live and outputs settings to
  paste. Tests still guard readability after any change.
- Decided by: Thomas (layout, fit-to-width, centered stars, wanting easy color edits); Claude (Color Lab).

## 2026-10-22 · Cards: flavor colors take over, brand fonts, stars; no brand colors
- Brand colors are dropped. The flavors' colors fill the card: each flavor's hue at one fixed lightness
  per mode, one hard-edged diagonal band per flavor. Dark mode uses slightly deeper but still bright
  tones with the same dark ink: darker tones made yellows and oranges muddy olive/brown.
- The brand name is set in a per-brand Google Font loosely in the spirit of its logo (style only, never
  the logo). Picks are a starting point; Thomas swaps any he doesn't like in `brandFonts.js`.
- Read-only stars show next to the score; the interactive control remains P1-21.
- Considered: a neutral card with flavor accents (Thomas's other option). Mocked it; the flavors become
  a thin band and the cards feel clinical, so the takeover won.
- Decided by: Thomas (direction); Claude (takeover over neutral, dark-mode treatment, font picks).

## 2026-10-22 · Placeholder flavor icons drawn in code (for now)
- `FlavorIcon.jsx` draws 11 simple category icons as inline SVG, in the card's text color, so the
  cards can ship now. They get replaced by the illustrated set from the Phase 4 designer brief.
- Why: CLAUDE.md wants our own icons, not stock sets, and none exist yet.
- Decided by: Claude, proposed to Thomas on 2026-10-22; not yet confirmed.

## 2026-10-22 · Replace third-party images with typographic cards (P1-0a..e)
- Approved the image-audit proposal: brand color tokens → `<ProductCard>` → swap all product images
  (removes the 70 Amazon images) → typographic brand pages. `imageURL` data is kept.
- Ordering: the image tickets come right after P1-1, ahead of the rest of Phase 1, because the Amazon
  images are the biggest licensing risk.
- Decided by: Thomas (proposal by Claude).

## 2026-10-22 · The CSP is an HTTP header, not a `<meta>` tag
- `server/app.js` sends it via `helmet` in production; `client/index.html` no longer has one. Browsers
  enforce every policy they see, so keeping both would mean the stricter one silently wins.
- Decided by: Claude (P1-1).

## 2026-10-22 · Tests use Node's built-in runner, not Vitest
- `node --test` + `node:assert`, with supertest and mongodb-memory-server-core for API tests.
- Why: every existing test already used it; it works on Node 20 (prod) and 22 (local) with no extra
  dependency; one way to run everything. Revisit if we need watch-mode UI or module mocking.
- Decided by: Claude (within P0-9 scope).

## 2026-10-22 · `staging:refresh` scrubs emails by default
- Every refresh replaces user emails with `user+<id>@example.test` and clears reset/verification tokens.
  `--keep-emails` opts out. The roadmap had scrubbing as an optional flag.
- Why: staging runs real app code, including the email-sending flows. A staging copy holding real
  emails is the most likely way to accidentally email real users, so the safe behavior is the
  default. Passwords are untouched; log in as `user+<your _id>@example.test`.
- Decided by: Claude (within the approved P0-7 scope); Thomas can reverse it.

## 2026-10-21 · Docs live in the repo, except AUDIT.md
- `docs/` (CLAUDE.md, SPEC, ROADMAP, DECISIONS, HANDOFF) is committed to `main`. `docs/AUDIT.md` stays
  local and gitignored, because it details security gaps that remain open until the Phase 1 security
  tickets ship. Revisit after P1-1..P1-9.
- `engines.node` gets pinned to the major Render uses today (`20.x`; Render reported 20.12.0), so the
  next deploy doesn't change prod's Node major. Node 20 is past end-of-life (April 2026); moving to
  22 is tracked in P1-10 and gets tested on staging first.
- Decided by: Thomas.

## 2026-10-21 · Product visuals are text/color cards; no scraped images or logos

- Product cards are generated from data (brand color, names, score, own icons). No downloaded or
  hotlinked third-party photos; no brand logos.
- Amazon images only via the official API inside the "Where to buy" block, after API access is granted
  (Amazon typically requires qualifying sales first). Until then the block is text-only.
- Possible later: user photo uploads (requires ToS license grant + registered DMCA agent) or own photos.
- Why: copyright/takedown risk on rehosted images; Amazon Associates terms forbid rehosting its images;
  logos are trademarks and imply endorsement. Text cards are also more consistent.
- Decided by: Thomas.

## 2026-10-21 · Admins are listed in the `ADMIN_USER_IDS` env var (for now)

- `removeUser` stays (Thomas uses it as admin) but is admin-only. The `users` query is admin-only too.
- Admin = the logged-in user's `_id` appears in the comma-separated `ADMIN_USER_IDS` env var. If the
  var is unset, nobody is an admin (fails safe).
- Why: no schema change or migration is needed for an emergency hotfix. P1-7 adds a proper `role` field,
  which can replace this.
- Decided by: Thomas (keep removeUser, admin-only); Claude (mechanism).

## 2026-10-21 · Security hotfix scope (P0-0)

- Writes use the logged-in user from the JWT, never a `userId` sent by the client. Edits/removals are
  owner-or-admin.
- Included beyond the original ticket, because each is a one-line guard that protects data integrity:
  - ratings limited to 0.5–5 in half steps
  - new duplicate ratings rejected (one per user per product)
  - email verification enforced server-side for reviews (the client already required it; SPEC keeps it for reviews)
- Not included (waits for Phase 1): rate limiting, cookie sessions, hashing reset tokens at rest,
  removing tokens from the query string/body.
- Decided by: Thomas (hotfix first); Claude (scope).

## 2026-10-21 · Existing duplicate ratings: keep the newest, archive the rest

- In the P1-13 migration, before adding the unique `(user, bubblyWater)` index: keep the most recent
  rating per pair; move the older ones to a `ratings_duplicates_archive` collection; repoint reviews
  and product/user ref arrays to the kept rating; recompute averages. `down` restores everything.
- Why: the newest rating is the user's current opinion (the UI shows one rating per user anyway).
  Archiving instead of deleting respects hard rule 3 and keeps the migration reversible.
- Going forward, the hotfix rejects new duplicates; P1-15 makes `addRating` an upsert.
- Decided by: Claude (delegated by Thomas).

## 2026-10-21 · Scheduled jobs: GitHub Actions for read-only work, Render Cron for prod writes

- Backups (read-only prod user, encrypted archive) → GitHub Actions → R2.
- Nightly aggregate/top-review recompute (P1-16) and the weekly link health check (P15-6) write to the
  prod DB → Render Cron Jobs, sharing the web service's env group.
- Why: the repo is public, so a read-write prod credential shouldn't live in GitHub secrets. Render
  already holds `MONGODB_URI`. The cost is about $1/mo per cron job. Running in-process (node-cron in
  the web server) was rejected: it duplicates runs across instances and is skipped whenever the
  service is down or restarting.
- Decided by: Thomas (backups → GH Actions/R2); Claude (recompute/link check, delegated).

## 2026-10-21 · Production deploys `main`; staging is a Render Starter service on `staging`

- Hotfixes branch from `origin/main`. Feature work goes through `staging` → `main`.
- Decided by: Thomas.

## 2026-10-21 · Uncommitted `new-aesthetic` work is left alone

- It isn't merged or committed by Claude. It may serve as light inspiration for Phase 4, but
  Aura Bora remains the design true north.
- Decided by: Thomas.

## 2026-10-21 · Production Atlas credentials rotated

- The password exposed in public git history (commit `1f7c729`) was rotated.
- Decided/done by: Thomas.
- 2026-10-23: Card palette is **splash** (Thomas): white top, the first flavor's vivid color filling below the wave, the other flavor's deep tone for the wave line and bubbles. Compact cards are all water. Stars use the most vivid tone a step darker than the fill. Other palettes stay available in `colorSettings.js` / the Color Lab.
- 2026-10-23: Card palette switched to **soda** (Thomas): the first flavor's vivid color fills the card; white bubbles, or the other flavors' deep tones on multi-flavor cards; text sits on 90% patches of the card color so bubbles never cross letters. Splash and the others stay selectable.
- 2026-10-24 (P1-10): `npm audit` is at 0 high/critical in server and client. The client's remaining 5
  **moderate** findings are accepted until the Phase 4 rebuild (they need majors: Tailwind 4, React Router 7):
  `postcss-selector-parser`/`postcss-nested` via Tailwind 3 (build-time CSS parsing only; never runs in
  visitors' browsers), and two React Router 6 issues: an open redirect that needs a `<Link>` or
  `navigate()` target starting with a backslash (ours are all app paths built from `/…` literals) and an
  SSR-hydration issue (we don't server-render). Vite went 5 → 6.4.5 (no config changes needed) to clear its
  dev-server advisories; Apollo Server went 4 (end of life) → 5 with `@as-integrations/express4`.
- 2026-10-24 (Thomas, P1-13): ratings and reviews that can never be shown are **archived**, not deleted:
  stranded ones (product and user both gone: 520 ratings, 61 reviews on staging, from an older copy of the
  data), the 21 anonymous ratings from before rating required a login, and (Claude, same reasoning) ratings
  whose product or user alone is gone. Duplicates keep the newest rating. They move to `ratings_archive` /
  `reviews_archive` with `_archive.reason`; the migration's `down` restores them exactly.
- 2026-10-24 (P1-18, Claude; Thomas can change the numbers in `server/utils/ratingRules.js`): rating abuse
  controls now that rating doesn't need a verified email. Per account: 120 ratings or rating edits per hour;
  accounts under 24 hours old: 30 per hour (a real person rarely rates more than a few dozen waters in a
  sitting). `trustedForAggregates`: verified accounts, or unverified ones at least 7 days old; leaderboards
  and "controversial" lists will count only trusted raters (Phase 2). Account age comes from the user's
  ObjectId, so no new field or migration.
- 2026-10-24 (Phase 1 exit check, Claude): every SPEC §4 item is done except one, deferred to Thomas: rotating
  the R2 access key and the read-only `backup-ro` Atlas password, which were visible to Claude in an editor
  selection early in the project (staging/backup credentials, not production).
