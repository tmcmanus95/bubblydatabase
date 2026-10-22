# Decisions

Newest first. Format: date · decision · why · who decided.

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
