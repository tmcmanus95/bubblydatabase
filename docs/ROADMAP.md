# BubblyDB — Roadmap

_Status: **Approved by Thomas (2026-10-21).** **Phase 0 complete** (released to `main` in #173). Phase 1 started._
_Sources: `docs/SPEC.md`, `docs/AUDIT.md`. Last updated 2026-10-22._

**Next up:** Thomas: review the P1-0d PR (brand pages, CSP images locked down) and P1-0e (asset provenance). Claude: P1-2 (rate limiting). PRs now go into `staging`; Thomas releases with a `staging` → `main` PR.

## How to read this

- Tickets are sized for one 30–60 minute session. Each one is a small, reviewable diff.
- **Owner:** 🤖 Claude builds, Thomas reviews · 🧑 Thomas only (dashboards, credentials, prod deploys).
- **DB:** `none` · `staging-read` · `staging-write` (script prepared by Claude, **run by Thomas**). No
  ticket ever touches production. Prod migrations are run by Thomas, after a fresh `mongodump`.
- **Branches:** see `CLAUDE.md` → Branches. Prod deploys `main`; work goes short branch → `staging` → `main`.
- Status: `todo` / `doing` / `done`.

## Inputs from Thomas (2026-10-21)

- Security hotfix first, ahead of backups.
- Production Render service deploys `main`.
- Backups: GitHub Actions → Cloudflare R2 (the repo is public, so archives are encrypted with `age`).
- Staging Render service: Starter (paid) plan.
- `removeUser` stays, admin-only. Uncommitted `new-aesthetic` WIP is left as-is (light design
  inspiration only; Aura Bora stays the true north). Duplicate-rating handling and the scheduler
  choice were delegated to Claude; see `DECISIONS.md`.

---

## Phase 0 — Safety net (remaining)

### P0-0 Security hotfix track

#### P0-0a 🧑 Rotate the leaked Atlas credentials — 15m — DB: none — done (2026-10-21, per Thomas)

Rotate the Atlas user whose password is in commit `1f7c729`. Update `MONGODB_URI` on Render. Check
Atlas access/audit logs for unfamiliar IPs. Delete the local `server/config/onRenderConnection.js`.

- [ ] Old password no longer authenticates
- [ ] Prod site works after the Render env update
- [ ] Atlas Network Access reviewed (IP allowlist instead of `0.0.0.0/0` if Render egress allows)
- [ ] Outcome noted in `DECISIONS.md`

> P0-0b, P0-0c and P0-0d were built together in one commit, `fba7162`, on local branch
> `hotfix/p0-security` (worktree `../hotfix-p0-security`, based on `origin/main` @ `647edc5`).
> Verified with 50 resolver checks against a throwaway local mongod (fake data), plus validation of
> every client operation (`main` and `new-aesthetic`) against the new schema: no new errors. The
> verification scripts are in the session scratchpad; they get turned into real tests in P0-9..12.
> Small extras included: ratings limited to 0.5–5 in half steps, one rating per user per product
> (new duplicates rejected), and server-side email verification required for reviews (matching the
> existing client behavior).

#### P0-0b 🤖 Remove sensitive fields from the public GraphQL schema — 45m — DB: none — done (not deployed)

Branch `hotfix/p0-security` from `origin/main`. Files: `server/schemas/typeDefs.js`, `resolvers.js`.

- [x] `User` type no longer has `password`, `emailVerificationToken`, `passwordResetToken`, `passwordResetExpires`
- [x] `User.email` resolves only for the authenticated user themself (null otherwise)
- [x] `users` query is admin-only (the client never used it)
- [x] An anonymous `{ users { passwordResetToken } }` fails validation
- [x] Every operation in `client/utils/queries.js` + `mutations.js` (on both `main` and `new-aesthetic`) checked against the new schema: 0 new errors
- [x] No client changes needed (client already sends `Authorization: Bearer`)

#### P0-0c 🤖 Authentication + ownership on all mutations — 60m — DB: none — done (not deployed)

Files: `server/utils/auth.js` (`requireUser`, `requireSelfOrAdmin`, `requireAdmin`, `isAdmin` via `ADMIN_USER_IDS`), `server/schemas/resolvers.js`.

- [x] `addRating`/`addReview`/`addLikeToReview`/`removeLikeFromReview` ignore the `userId` argument and use `context.user._id` (the argument stays in the schema for compatibility)
- [x] `editRating`, `removeRating`, `editReview`, `removeReview` return FORBIDDEN unless the caller owns the document (admins allowed)
- [x] `editUserColor` self or admin; `removeUser` and `users` admin only
- [x] Anonymous calls to any of these → `UNAUTHENTICATED`
- [ ] Manual check by Thomas in local dev (`MONGODB_URI` = staging): rate, edit rating, review, like, change color. Note this writes to staging, so Thomas runs it.

#### P0-0d 🤖 Reset/verification fixes — 30m — DB: none — done (not deployed)

- [x] `resetPassword` rejects wrong, expired or already-used tokens; returns `{ user }` to match `AuthPayload`
- [x] `forgotPassword` returns `true` whether or not the email exists (no account enumeration)
- [x] `resendEmailVerification` doesn't crash on an unknown email and returns `true`
- [x] `verifyEmail` requires the token _and_ the matching userId before saving

#### P0-0e 🧑 Ship the hotfix — 20m — DB: none — done (PR #160 → `main` @ `1ffa11a`)

- [x] Render prod env: add `ADMIN_USER_IDS=<Thomas's user _id>` (comma-separated if more). Without it, `removeUser`/`users` are refused for everyone, which is safe.
- [x] Push `hotfix/p0-security`, open a PR → `main` (#160)
- [x] Tested locally against staging by Thomas; reviewed and merged
- [x] Thomas confirmed on prod: logged out, `users` and `removeUser` are refused; logged in, rating/review/like work (2026-10-21)
- [x] `main` merged into `new-aesthetic` (local merge commit `5e517d7`, after a local WIP snapshot commit `321b6a1`; not pushed). The like-resolver conflict was resolved with `main`'s `requireUser` version; 50/50 resolver checks and the P0-1 guard tests pass on the merged code.

### P0-1 🤖 Quarantine database scripts — 45m — DB: none — done (PR #161 → `main` @ `f2f8670`)

Files: `server/seeders/{seed,cleanDB,addSeeds}.js`, new `server/scripts/lib/{assertStaging,stagingConnection}.js`, `server/config/onRenderConnection.js` (now a tracked stub that exits), `server/package.json` (`npm test` = `node --test`).

- [x] Every tracked script connects only through `scripts/lib/stagingConnection.js` (env `MONGODB_URI` from `server/.env`); no hardcoded URIs remain in the repo
- [x] `assertStaging()` parses the URI before connecting and exits non-zero unless the db name is exactly `bubblydatabase3_staging` or every host is local
- [x] `seed.js` requires `--yes-drop-staging`; `cleanDB.js` re-checks the connected db right before dropping
- [x] Unit tests: every `seeders/*.js` refuses a prod URI, with no network (9 tests; 14 with Thomas's local-only scripts present)
- [x] `calculateTopReviews.js` (uncommitted WIP, local only) switched to `require("../scripts/lib/stagingConnection")` by Claude at Thomas's request. It only runs once `main` is merged into `new-aesthetic`; until then it fails with "module not found", which is safe.

### P0-2 🤖+🧑 Repo hygiene — 30m — DB: none — done (PR #162 → `main` @ `39e5f64`; Node pin in a follow-up PR)

- [x] Uncommitted WIP on `new-aesthetic` is left untouched (Thomas's call). New work branches from `main`.
- [x] `server/.env.example` (every key the code reads, incl. `ADMIN_USER_IDS`, no values); root `.gitignore` covers `.env*`, `.DS_Store`, `node_modules/`; tracked `.DS_Store` files removed from git
- [x] Docs committed to `main`, except `docs/AUDIT.md`, which stays local and gitignored until the Phase 1 security tickets ship (Thomas, 2026-10-21)
- [x] Branch strategy written in `CLAUDE.md` (Branches) + real commands under Commands
- [x] `staging` branch created from `main` @ `39e5f64`
- [x] `engines.node` = `20.x` in the root `package.json` (Render reported 20.12.0). Render resolves `20.x` to the latest Node 20 patch, so the next deploy picks up 20.x security patches but stays on Node 20.

### P0-3 🤖 Backup script — 45m — DB: staging-read — done (PR #164 → `main` @ `089e3f3`)

Files: `scripts/backup.sh`, `scripts/test/backup.test.js` (`node --test scripts/test/backup.test.js`).

- [x] `mongodump --uri=… --archive --gzip` piped straight into `age -r "$AGE_PUBLIC_KEY"` → `<db>-YYYY-MM-DDTHHMMZ.archive.gz.age`; the plaintext dump never touches disk
- [x] Uploads to R2 through the S3 API (`aws s3 cp --endpoint-url`), then verifies with `head-object`; credentials are redacted from any tool output (tested)
- [x] Non-zero exit on any failed step; archives under `MIN_BACKUP_BYTES` (10 KB) or without an age header are rejected and deleted; requires an explicit db name in the URI
- [x] `--local-only DIR` mode for dry runs (no upload); bash 3.2 compatible (macOS)
- [x] Verified: 7 tests with fake tools; real `mongodump` → archive → `mongorestore` round trip on a throwaway local mongod (counts match)
- [x] Dry run by Thomas against staging (2026-10-21): archive created, decrypted with the real age key, valid mongodump archive. The age keypair from the dry run is the real one: public key goes to GH secrets in P0-4, private key lives only in Thomas's password manager

### P0-4 🧑 Backup infrastructure — 30m — DB: none — done (2026-10-22)

- [x] R2 bucket `bubblydb-backups` (private) with a 30-day delete lifecycle rule; R2 API token scoped to this bucket (Object Read & Write: read is needed to verify uploads). R2 has no object versioning; a bucket lock rule (e.g. 7 days) is the optional equivalent
- [x] Atlas user `backup-ro` with only `read` on `bubblydatabase3` (less access than the built-in `backup` role)
- [x] `age` keypair: public key in GH secrets, private key only in Thomas's password manager
- [x] GH Actions secrets (names as saved): `BACKUP_MONGODB_URI`, `AGE_PUBLIC_KEY`, `R2_ACCESS_KEY`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET`

### P0-5 🤖 Backup workflow — 30m — DB: none — done (PR #166 → `main` @ `364ff1e`)

File: `.github/workflows/backup.yml`.

- [x] Triggers: daily `schedule` (08:17 UTC) + `workflow_dispatch` only (never `pull_request`, so forks can't reach secrets); `contents: read` permissions; no persisted git credentials
- [x] Pinned installs: database tools 100.19.1 `.deb` with sha256 check, `age` from Ubuntu, `actions/checkout` pinned to a commit; runs `scripts/backup.sh`
- [x] Failure notifies Thomas (GitHub emails the workflow owner on failed scheduled runs)
- [x] First manual run (started by Claude with `gh workflow run`, 2026-10-22 01:29 UTC) succeeded: users 45, reviews 159, ratings 1350, bubblywaters 442 (plus the empty `bubblydatabase3` collection); 79,896-byte encrypted archive uploaded to R2
- Note: GitHub disables scheduled workflows in public repos after 60 days without repo activity. A backup-freshness check belongs in P1-9 (uptime monitoring).

### P0-6 🤖 Restore + verification — 60m — DB: local only — done (PR #167)

Files: `scripts/restore.sh`, `server/scripts/verifyCounts.js`, `scripts/test/restore.test.js`, `docs/RUNBOOK.md`.

- [x] `restore.sh <file|r2-key|latest> <targetDb>` downloads (or reads a local file), decrypts with `AGE_IDENTITY_FILE`, and streams into `mongorestore --drop --nsFrom '<src>.*' --nsTo '<targetDb>.*'`; the plaintext never touches disk
- [x] Refuses `bubblydatabase3` as a target, and anything that isn't `bubblydatabase3_staging` or local (same `assertStaging` guard as P0-1); credentials redacted from output
- [x] `verifyCounts.js` (in `server/scripts/`, read-only, staging/local only) prints per-collection counts + indexes and compares them to the counts mongorestore reported; fails on mismatch or an empty database
- [x] Tests: 5 end-to-end tests with real mongodump/mongorestore/age on a throwaway local mongod (restore, re-restore without duplicates, wrong key, refusals, `latest` from R2 via a fake aws)
- [x] Thomas restored the latest real backup (2026-10-22) into a **local** `bubblydatabase3_restoretest` (the staging Atlas user can't write other databases, and this way the prod copy never leaves his machine); counts matched (users 45, bubblywaters 442, ratings 1350, reviews 159; 1996 documents, 0 failures; indexes restored); db dropped after. Steps: `docs/RUNBOOK.md` → Monthly restore test
- [x] `RUNBOOK.md`: where everything lives, health checks, monthly restore test, manual production restore (Thomas only), key/token incidents

### P0-7 🤖 `npm run staging:refresh` — 45m — DB: staging-write — done (PR #168)

- [x] `npm run staging:refresh [-- <file|r2-key>]`: latest R2 backup (default) → `restore.sh` → `bubblydatabase3_staging` (`--drop` only on restored collections) → `verifyCounts`
- [x] Refuses unless `MONGODB_URI` (env, else `server/.env`) names `bubblydatabase3_staging`
- [x] Email scrub is the **default** (changed from an optional `--scrub`; see DECISIONS): emails → `user+<id>@example.test`, reset/verification tokens cleared, passwords untouched. `--keep-emails` opts out
- [x] Tests: 4 end-to-end tests on a throwaway local mongod (stale data replaced, scrub, `--keep-emails`, refusals); restore tests now share `scripts/test/helpers.js`
- [x] Thomas ran it end to end against Atlas staging (2026-10-22): counts matched, 45 emails scrubbed

### P0-8 🧑 Staging Render service — 30m — DB: none — done (2026-10-22)

- [x] New Render web service on branch `staging` (auto-deploy). Its build command installs the client's devDependencies, because with `NODE_ENV=production` plain `npm install` skips `vite` (`vite: not found`)
- [x] Env: staging-only `MONGODB_URI`, its own `MY_SECRET`, `WEBSITE_URL` = staging URL, `EMAIL_MODE=log`, `NODE_ENV=production`, `ADMIN_USER_IDS`; no Gmail credentials
- [x] Staging URL loads the app with staging data; Thomas logged in as `user+<_id>@example.test`
- [x] `staging` branch fast-forwarded to `main` @ `9ff0f1f` (includes `EMAIL_MODE`)
- [ ] Optional: Render's basic auth or a non-indexed URL so staging stays out of search engines

### P0-9 🤖 Test harness — 45m — DB: none — done (PR #169)

- [x] Node's built-in test runner (instead of Vitest; see DECISIONS) + supertest + mongodb-memory-server-core in `server/`; helpers in `server/tests/helpers.js` (`startTestServer()` → `gql()`, `reset()`, `outbox`)
- [x] `server/app.js` (`createApp()`) builds the app without connecting or listening; `server.js` just connects and listens, same startup as before (verified by booting it against a throwaway local mongod)
- [x] `sendEmail` has `EMAIL_MODE=log`: nothing is sent; messages land in `outbox`. The Gmail transporter is created lazily
- [x] Root scripts: `npm test` (server + script suites) and `npm run dev` (server with `node --watch` + client, via `concurrently`)
- [x] 3 health tests pass; tests use the local `mongod` when installed (no download), never Atlas. Without a local `mongod`, the binary is downloaded once from MongoDB and cached
- [ ] Thomas tries `npm run dev` once (Claude couldn't: Thomas's dev servers were using ports 3000/5001)

### P0-10 🤖 Smoke tests: signup + login — 45m — DB: none (in-memory) — done (PR #171)

`server/tests/auth.test.js` (9 tests)
- [x] Signup creates an unverified user with a hashed password, returns a token, and the outbox gets a verification URL; duplicate username/email rejected
- [x] Login succeeds with the correct password and fails with a wrong one or an unknown email; the token works for `meId`
- [x] Email verification and password reset flows (token must match, reset expires and is single-use, no account enumeration)
- [x] Regression: `users` admin-only; sensitive fields not in the schema; email visible only to its owner (P0-0b)

### P0-11 🤖 Smoke tests: search + product page — 45m — DB: none (in-memory) — done (PR #171)

`server/tests/catalog.test.js` (6 tests), fixtures in `server/tests/fixtures.js`
- [x] Fixtures: products, users, ratings, reviews
- [x] `searchGeneralBubblyWater` (text index), `searchVagueProductName`, `flavors`, `brand`, caffeine/CBD lists return the expected products
- [x] Home top list ranks by average and only includes products with more than 3 ratings
- [x] `bubblyWater(id)` returns ratings/reviews with public user info only; unknown id → `null`

### P0-12 🤖 Smoke tests: rate + review — 45m — DB: none (in-memory) — done (PR #171)

`server/tests/ratings.test.js` (7 tests): the P0-0 hotfix checks, now permanent
- [x] An authenticated rate updates `averageRating`; an edit updates it again (and ignores a bogus `bubblyWaterId`); one rating per user; half steps 0.5–5 only
- [x] Review create/edit/remove works for the owner; verified users only; linked to the reviewer's rating
- [x] Regression: anonymous or other-user writes rejected; client `userId` ignored; likes; profile color; `removeUser` admin-only (P0-0c)
- [x] Checked that the tests catch regressions: removing the `editRating` ownership guard makes the suite fail

### P0-13 🤖 CI — 30m — DB: none — done (PR #172)

- [x] `.github/workflows/ci.yml`: Node 20, MongoDB 8.0 + database tools + age installed (sha256-checked), `npm test` (all 50 tests, none skipped) and the client build on every PR and on pushes to `staging`/`main`
- [x] Green on the PR (first run: 34 + 16 tests, 0 skipped, build OK)
- [ ] Thomas (optional): require the `test` check before merging into `main` and `staging`

**Phase 0 exit criteria:** hotfix live; a tested restore documented; daily encrypted off-site backups
running; staging refreshable and deployed; smoke tests green in CI.
**Status (2026-10-22): all met** (pending the P0-13 merge).

---

## Phase 1 — Security baseline

#### P1-0 🤖 Image audit — 30m — DB: staging-read — done (PR #174)

Report: `docs/IMAGE_AUDIT.md`; script: `server/scripts/imageAudit.js` (read-only, never fetches images)
- [x] All 442 products hotlink third-party images from 74 hosts (Amazon 70, brand sites 211, retailers 109, CDNs 40, Google thumbnails 6, blogs 6); all 43 brand logos are hotlinked; 8 client render sites listed
- [x] Classified: own 0 · user 0 · third-party hotlink 442; the site's own decorative assets have unknown provenance
- [x] Proposal: brand color tokens → `<ProductCard>` → swap all product images (removes the Amazon images) → typographic brand pages; keep `imageURL` data; optional later rename only with approval
- [x] Thomas approved the proposed tickets (2026-10-22): P1-0a..e below

#### P1-0a 🤖 Brand color tokens — 45m — done (PR #176), **superseded**: Thomas dropped brand colors on 2026-10-22; cards use flavor colors (see P1-0c follow-up). `brandColors.js` removed

- [x] `client/src/theme/brandColors.js`: a 12-color OKLCH palette (light bg/ink + dark bg/ink) and an explicit color for all 44 current brands; alphabetical neighbors get well-separated hues. Flavor colors are still hex in `App.css` (move into the theme in Phase 4)
- [x] Brands not listed get a stable automatic color (FNV hash of the name); `brandStyle()` + `.brand-surface` (index.css) apply it, following the OS light/dark setting like Tailwind
- [x] Test: every color in sRGB gamut and ≥ 4.5:1 text contrast in both modes (actual 7.5–11:1); every brand with a page has an explicit color (`client/src/theme/brandColors.test.js`, in `npm test`)
- [x] Swatches checked visually in light + dark (lemon brightened so it reads yellow, not khaki)

#### P1-0b 🤖 `<ProductCard>` typographic component — 60m — done (PR #178, layout follow-up #179)

- [x] `client/src/components/ProductCard.jsx` (`full` and `compact` variants): brand color surface, flavor name in Lilita One, brand name, caffeine/CBD tags, score as the anchor ("No ratings yet" otherwise); no photo
- [x] `FlavorIcon.jsx`: 11 placeholder category icons drawn in code (citrus, berry, stone, tropical, orchard, melon, botanical, spice, brewed, plain, bubbles), until the Phase 4 illustrated set exists. `flavorCategories.js` maps all 87 flavors (tested)
- [x] Real text; the whole card is one link (stretched flavor link) with a visible focus ring; AA contrast from P1-0a tokens; "out of 5" for screen readers
- [x] Hand-cut sticker look (wobbly radius, solid offset shadow, slight tilt on hover/focus); tilt off with `prefers-reduced-motion`
- [x] Preview page `/working/cards` (not linked) with real data; checked in light and dark mode via headless Chrome screenshots
- [x] Follow-up from Thomas's review: every element in a fixed slot (brand always top-left, icon top-right, name in a 2-line slot, flavor chips, score bottom-left, tags bottom-right; same card height), and **all flavor colors visible**: a split stripe along the top edge (left edge on compact) plus color-dot chips (up to 3, then "+N"). Colors come from `client/src/theme/flavorColors.js`, copied from App.css and kept in sync by a test (OKLCH conversion in Phase 4). Pineapple and peach icons redrawn so every category is distinct

#### P1-0c 🤖 Swap product images for cards — 45m — done (PR #180)

- [x] All 6 product render sites use `<ProductCard>`: list items (full card + "Your rating" for logged-in users), product page (new `hero` variant, not a link, with "More from <brand>" and flavor links beside it), search results, profile ratings/reviews and recent reviews (`compact`, with that person's rating in the score slot via the new `score`/`scoreDetail` props). `imageURL` removed from all 17 client queries + 1 mutation; caffeinated + search queries gained the card fields; all 32 client operations validate against the schema
- [x] **Removes all 70 Amazon images** and every other third-party product photo: on home, product, search, profile and recent pages, the only `<img>` left is our own `bubblesicon.png` (checked in headless Chrome)
- [x] `imageURL` stays in the database and schema (hard rule 3)
- [x] Deliberate change: list rows no longer have their own brand/flavor links (the card is one link); brands and flavors stay reachable from the navbar and the product page
- [x] CSP `img-src` tightened to `'self' data:` with P1-0d (brand logos were the last external images); a test pins it. P15-5 adds Amazon's image host when the "Where to buy" block lands
- [x] Follow-up from Thomas's review (in review): **flavor colors take over the card** (each flavor's hue at a fixed pastel lightness; one hard-edged diagonal band per flavor; dark mode uses slightly deeper still-bright tones with the same dark ink, since darker tones turned yellows muddy), **brand name in a per-brand Google Font** loosely in the spirit of its logo (44 brands, one stylesheet, only used fonts download), **read-only stars** next to the score. Brand colors removed. Tests: every flavor color in gamut with ≥ 6.9:1 contrast in both modes; every brand has a font and is in the stylesheet URL — merged (#181)
- [x] Second round from Thomas (#182): punchier card colors, **solid flavor-colored pills** (each hue at its natural vivid lightness, so yellows stay yellow), **bigger brand names**, **flavor-colored stars** (always darker than the card so they read as filled; deep rich tones in dark mode). Tests: pills AA + vivid (light) / distinct (dark); stars clearly separated from their card in both modes
- [x] Third round (#183): **layout "B · Score sticker"** picked by Thomas from three mocks (score in a round badge filled with the flavor color, stars centered along the bottom, tags at the end of the pill row; 12.75rem tall, was 15.5), **colored hover shadow** (strong flavor color), **brand names auto-fit** their space (`FitText`), stars bigger (1.75rem) in their own slot ready for P1-21, and an **easy way to edit colors**: every knob in `client/src/theme/colorSettings.js` plus the live **Color Lab** at `/working/colors` (sliders, light/dark previews, readability check, "Copy settings")
- [x] Flavor icons removed (Thomas, 2026-10-22: "no icons for now"); the brand name takes the full top line (#184)
- [x] **Brand border** (#185): each card's border is the brand's package color (`client/src/theme/brandColors.js`, editable in the Color Lab), ringed in ink so white brands show. **Mobile fix:** cards used to be wider than phone screens and pills got sliced; now a two-column grid lets brand names shrink, pills use the full width when there are no tags, and pills that don't fit drop whole (verified at 390px with real mobile emulation: no overflow, no cut pills). **Background patterns**: **waves** (Thomas's pick, now the default), bands, bubbles, gradient, stripes, set via `pattern` in `colorSettings.js`, previewable at `/working/cards?pattern=…` and in the Color Lab
- [x] **Wave motion** (in review): on hover or keyboard focus the waves slosh slowly (sideways drift and a gentle bob on separate clocks), and tiny bubbles in the bottom region, colored like the flavor above, rise and fade before the wave. Leaving a card freezes it in place; off with "reduce motion"

#### P1-0d 🤖 Brand pages without logos — 30m — in review

- [x] Brand page and All Brands grid are typographic: `<BrandTile>` shows the brand name in its brand font on a paper sticker, framed in the brand's package color like the product cards (brand colors were approved for card borders on 2026-10-22, so the tiles match); official site stays as a text link (now a real external link; the old one called an undefined function)
- [x] `link` removed from `brandLogos.json` (keep `site`); dead `Header.jsx` deleted

#### P1-0e 🧑 Own asset provenance — 15m

- [ ] Thomas confirms where `bubblesicon.png` and the bubble textures (`whitebubbles.jpg`, `blackbubbles.jpg`) came from; if the license is unknown, they're replaced in Phase 4
- [ ] Remove unused `bubblesbackground.webp` and `vite.svg`

#### P1-1 🤖 helmet, explicit CORS, body limits — 30m — done (PR #175)

- [x] `helmet` on every response; the CSP is an HTTP header in production (`server/app.js`) allowing exactly what the site uses: own scripts, inline styles (MUI) + Google Fonts, Formspree, `img-src https:` (until P1-0c/d)
- [x] Removed the old `<meta>` CSP from `client/index.html`. It was **blocking the Lilita One font on the live site** (and Formspree), confirmed in headless Chrome
- [x] `cors` on `/graphql` only allows origins listed in `CORS_ORIGINS` (empty = same-origin site only)
- [x] `express.json({ limit: "100kb" })` on `/graphql`; `urlencoded` removed
- [x] 6 new tests; all 56 green. Built site served in production mode: 0 CSP violations on home + contact (headless Chrome)
- [x] Thomas checked staging (2026-10-22): Lilita One renders; the contact form sends. Prod gets it with the next release

#### P1-2 🤖 Rate limiting — 45m — in review

- [x] Global limiter on `/graphql` (1500 requests / 15 min per IP; generous until P1-22 stops the home page sending one query per product)
- [x] Per-operation limits keyed on the mutation fields in the parsed query (the client-sent operation name is spoofable; aliases can't repeat a limited mutation): `login`, `addUser`, `forgotPassword`, `resetPassword`, `resendEmailVerification`, `addRating`, `editRating`, `addReview`
- [x] `trust proxy` = 1 hop in production (`TRUST_PROXY` env overrides); tests prove the 429 behavior. **Thomas:** confirm on staging that limits are per visitor (see the PR)

#### P1-3 🤖 Input validation + sanitizing — 60m

- [ ] zod schemas: ObjectIds, rating ∈ {0.5, 1, …, 5}, reviewText 1–500 trimmed, username/email/password rules
- [ ] `searchVagueProductName` escapes regex input (or switches to text search)
- [ ] `express-mongo-sanitize` (or equivalent) on request bodies
- [ ] Tests for rejected inputs

#### P1-4 🤖 Login lockout/backoff — 45m

- [ ] After N failed logins per account+IP within a window: increasing delay, then a temporary lock
- [ ] Generic error message; no account enumeration
- [ ] Tests

#### P1-5 🤖 bcrypt 6 + rehash on login — 30m

- [ ] Upgrade to `bcrypt@6` (existing hashes stay valid)
- [ ] On successful login, if the hash cost is below 12, rehash and save. No forced resets.
- [ ] Test: a cost-10 hash logs in and is upgraded

#### P1-6 🤖 Cookie sessions (split across 2 sessions) — 2 × 60m

- [ ] Access token (15m) + refresh token (30d, rotating, stored hashed server-side) in `httpOnly`, `Secure`, `SameSite=Lax` cookies
- [ ] Grace period: existing localStorage Bearer tokens are still accepted until a set date, then dropped; tokens no longer accepted from the query string/body
- [ ] Client: Apollo `credentials: "include"`, no token in localStorage, logout clears cookies
- [ ] CSRF protection on mutations (SameSite + Apollo's CSRF prevention / custom header)
- [ ] Existing users stay logged in or re-login normally (no password reset)

#### P1-7 🤖 Roles — 45m — DB: staging-write (migration)

- [ ] Migration adds `role: "user"` to all users (up/down); Thomas's account set to `admin` by hand
- [ ] `requireAdmin(context)` helper + tests; no admin routes exist yet

#### P1-8 🤖 Bot friction on signup — 45m

- [ ] Honeypot field (silent reject)
- [ ] Cloudflare Turnstile widget + server verification (`TURNSTILE_SECRET` env; disabled in tests)

#### P1-9 🤖+🧑 Errors, logging, uptime — 45m

- [ ] Apollo `formatError` masks internal errors in prod
- [ ] `pino-http` request logging (no tokens/passwords logged)
- [ ] 🧑 Uptime monitor (e.g. UptimeRobot/Better Stack) on prod + staging

#### P1-10 🤖 Dependency cleanup — 45m

- [ ] Remove `apollo-server-express`, `crypto`, `ldrs`/`axios` if unused (server); `express`, `dotenv`, `headlessui`, `heroicons` (client)
- [ ] In-range `npm update` in server + client
- [ ] `npm audit` reports 0 high/critical (or each exception documented in `DECISIONS.md`)
- [ ] Move prod to Node 22 LTS (Node 20 reached end-of-life in April 2026): `engines.node` → `22.x`, verify on staging first, then prod
- [ ] Smoke tests + client build green

## Phase 1 — Quick wins

#### P1-11 🤖 Migration runner — 45m

- [ ] `migrate-mongo` (or a minimal runner) with `migrations/`, up/down, changelog collection
- [ ] `npm run migrate:up` / `migrate:down` use `assertStaging()` unless `--i-am-thomas-on-prod` is passed
- [ ] Example no-op migration runs up and down on staging

#### P1-12 🤖 Data-integrity report — 30m — DB: staging-read

- [ ] Read-only script: duplicate (user, bubblyWater) ratings, dangling refs on products/users, `averageRating` drift
- [ ] Report saved. Resolution is already decided (see `DECISIONS.md`): keep the most recent rating per (user, product) and archive the rest

#### P1-13 🤖 Index migration — 45m — DB: staging-write

- [ ] Dedupe step first (before the unique index): for each (user, bubblyWater) keep the newest rating; move the others to `ratings_duplicates_archive`; repoint any review's `rating`, and `$pull` archived ids from the product and user arrays; recompute affected `averageRating`. `down` restores archived ratings and refs exactly.
- [ ] ratings: `{bubblyWater:1}`, `{user:1, createdAt:-1}`, `{createdAt:-1}`, unique `{user:1, bubblyWater:1}`
- [ ] reviews: `{bubblyWater:1, createdAt:-1}`, `{user:1, createdAt:-1}`, `{createdAt:-1}`
- [ ] bubblywaters: `{flavor:1, averageRating:-1}`, `{brandName:1}`, `{averageRating:-1}`
- [ ] Indexes also declared in the Mongoose schemas; `down` drops them; `explain()` shows IXSCAN on key queries

#### P1-14 🤖 Denormalized aggregates migration — 45m — DB: staging-write

- [ ] Adds `avgRating`, `ratingCount`, `reviewCount` to bubblywaters, backfilled with a `$group` pipeline
- [ ] `averageRating` kept (and kept equal) until the client switches over; `down` unsets the new fields
- [ ] verifyCounts-style check: totals match the raw collections

#### P1-15 🤖 Aggregates updated on write — 60m

- [ ] add/edit/remove rating and add/remove review update the aggregates atomically (update pipeline or `$inc`)
- [ ] `addRating` becomes an upsert (one rating per user per product)
- [ ] remove operations `$pull` refs from product and user
- [ ] Tests cover each write path

#### P1-16 🤖 Nightly recompute — 45m

- [ ] Job recomputes the aggregates (and top review) with `$group` + `bulkWrite`, logs drift
- [ ] Runs as a **Render Cron Job** (`node server/scripts/recompute.js`, nightly) using the same env group as the web service, so no prod write credential lives on GitHub; fixes the `topReview`/`topReviews` bug
- [ ] 🧑 Create the Render Cron Job (about $1/mo) once the script lands

#### P1-17 🤖 Remove the email gate for rating — 45m

- [ ] Logged-in unverified users can rate (client gate removed in `CustomColorRating`, `BubblyWaterListItem`, `BubblyWater`)
- [ ] Server: `addReview` requires `isVerified`; `addRating` doesn't
- [ ] Copy updated ("verify email to write reviews")

#### P1-18 🤖 Rating abuse controls — 45m

- [ ] Per-account rating rate limit and a stricter limit for accounts < 24h old
- [ ] `trustedForAggregates` rule (e.g. verified or older than N days) used later by leaderboards/controversial
- [ ] Thresholds in config; documented in `DECISIONS.md`

#### P1-19 🤖 Unified search resolver — 60m

- [ ] `search(q, flavor, caffeine, cbd, sort, page)` resolver using aggregation + indexes, paginated, returns counts not arrays
- [ ] Tests for each filter combination

#### P1-20 🤖 One search page, URL state — 60m

- [ ] `/search?q=&flavor=&caffeine=0&cbd=0&sort=` reads/writes URL params; results render under the bar
- [ ] Navbar + home search submit properly (`onSubmit` + `navigate`), with Enter-key support
- [ ] Flavor chips → `/search?flavor=x`; `/flavors/:flavor` and `/search/:term` redirect
- [ ] Back/refresh/share preserve state; manual check on staging

#### P1-21 🤖 Custom rating component — 60m

- [ ] Pointer events (mouse/touch/pen), live preview while dragging, commit on release
- [ ] Optimistic save with rollback + toast on error; half-star support
- [ ] Keyboard: arrows/Home/End; `role="slider"` with `aria-valuenow/min/max/valuetext`; visible focus
- [ ] Respects `prefers-reduced-motion`; replaces MUI `Rating` in `CustomColorRating`
- [ ] **Decided (Thomas, 2026-10-22): rate by tapping the stars directly on cards.** Safeguards: a touch only rates if the finger didn't move (scrolling never rates); the stars sit above the card's stretched link so tapping them never opens the product; a short "Rated 4 ★ · Undo" toast after each rating
- Note: read-only stars already show on every card (`client/src/components/Stars.jsx`, 2026-10-22) in their own slot (`.product-card__stars`), sized as a tap target; this ticket is the interactive rating control. Thomas wants stars kept. Interaction decided: tap directly (see above)

#### P1-22 🤖 Batched "my ratings" — 30m

- [ ] `myRatings(bubblyWaterIds: [ID!]!)` query; lists issue one request instead of one per item
- [ ] `findUsersRating` per-item calls removed

#### P1-23 🤖 Server N+1 cleanup — 60m

- [ ] `bubblyWaters`/`flavors`/`brand` return `ratingCount`/`reviewCount` and no longer populate arrays
- [ ] `recentReviews` returns the reviewer's rating through `$lookup`
- [ ] `user`/`me` paginated; unbounded `ratings`/`reviews`/`users`/`allBubblies` removed or paginated
- [ ] `updateTopReviews` uses `bulkWrite`

#### P1-24 🤖 Client loop cleanup — 45m

- [ ] `Recent.jsx`, `Brand.jsx`, `RatingsBreakdown.jsx` use single-pass/Map logic or server data
- [ ] `averageRatingWeighting` replaced by one comparator; conditional hook in `BubblyWaterList` fixed
- [ ] No visible behavior change (manual check on staging)

**Phase 1 exit criteria:** every SPEC §4 security item done or explicitly deferred in `DECISIONS.md`;
rating works without verification and has abuse controls; one shareable search page; aggregates
denormalized and indexed; `npm audit` high/critical = 0.

---

## Phase 1.5 — Affiliate-ready

#### P15-1 🤖 `offers` migration — 30m — DB: staging-write

- [ ] `offers: [{ retailer, asin, url, affiliateUrl, network, packSize, active, lastChecked, status }]` in the schema, default `[]`
- [ ] up/down migration; zod schema for an offer

#### P15-2 🤖 Admin offer management — 60m

- [ ] Admin-only mutations to add/edit/deactivate offers (`requireAdmin`, from P1-7)
- [ ] Minimal admin form on the product page, visible only to admins

#### P15-3 🤖 `/go/:productId/:offerId` redirect — 45m

- [ ] Express route: validates ids, active offers only, 404 otherwise
- [ ] Amazon: URL built from the ASIN + `AMAZON_ASSOCIATE_TAG` (untagged when empty); others: `affiliateUrl ?? url`
- [ ] Logs to a `clicks` collection `{productId, offerId, ts, referrerPath}` with no PII/IP stored; rate-limited
- [ ] 302 redirect; outbound links use `rel="sponsored nofollow noopener"`

#### P15-4 🤖 Disclosure component — 30m

- [ ] `<AffiliateDisclosure>` renders only when a tagged offer is shown; includes Amazon's required statement
- [ ] Accessible and on-brand (silly but clear)

#### P15-5 🤖 "Where to buy" block — 45m

- [ ] Product page lists active offers through `/go/...` links; hidden when there are none

#### P15-6 🤖 Weekly link health check — 45m

- [ ] Scheduled job checks each offer URL (HEAD, falling back to GET), updates `lastChecked`/`status`, reports broken links
- [ ] Runs as a weekly Render Cron Job (it writes to prod, same reasoning as P1-16); never runs from a Claude session

#### P15-7 🤖 Incentive guard — 15m

- [ ] Test/lint check that no badge/award code reads the `clicks` collection or offer data (SPEC: awards never reward clicking/buying)

**Phase 1.5 exit criteria:** offers can be added by an admin, redirects log clicks, disclosure shows
only when needed, and the link check runs weekly. Amazon tag stays empty until approved.
