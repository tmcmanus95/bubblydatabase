# BubblyDB — Roadmap

_Status: **Approved by Thomas (2026-10-21).** P0-0 through P0-4 done; P0-5 in review._
_Sources: `docs/SPEC.md`, `docs/AUDIT.md`. Last updated 2026-10-21._

**Next up:** Thomas: merge P0-5, then start the first backup run by hand. Claude: P0-6 (restore + verification).

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

### P0-5 🤖 Backup workflow — 30m — DB: none — in review

File: `.github/workflows/backup.yml`.

- [x] Triggers: daily `schedule` (08:17 UTC) + `workflow_dispatch` only (never `pull_request`, so forks can't reach secrets); `contents: read` permissions; no persisted git credentials
- [x] Pinned installs: database tools 100.19.1 `.deb` with sha256 check, `age` from Ubuntu, `actions/checkout` pinned to a commit; runs `scripts/backup.sh`
- [x] Failure notifies Thomas (GitHub emails the workflow owner on failed scheduled runs)
- [ ] A manual run by Thomas uploads an object to R2
- Note: GitHub disables scheduled workflows in public repos after 60 days without repo activity. A backup-freshness check belongs in P1-9 (uptime monitoring).

### P0-6 🤖 Restore + verification — 60m — DB: staging-write (scratch db) — todo

Files: `scripts/restore.sh`, `scripts/verifyCounts.js`, `docs/RUNBOOK.md`.

- [ ] `restore.sh <object-key> <targetDb>` downloads, decrypts (private key from a local file), and runs `mongorestore --nsFrom 'bubblydatabase3.*' --nsTo '<targetDb>.*'`
- [ ] Refuses `targetDb == bubblydatabase3`
- [ ] `verifyCounts.js` prints per-collection counts + index lists and compares them to the expected numbers
- [ ] Thomas restores the latest backup into `bubblydatabase3_restoretest`; counts match; the db is dropped after
- [ ] `RUNBOOK.md`: step-by-step disaster-recovery restore, including where the private key lives

### P0-7 🤖 `npm run staging:refresh` — 45m — DB: staging-write — todo

- [ ] Root script: latest R2 backup → `restore.sh` → `bubblydatabase3_staging` with `--drop` scoped to the staging namespace → `verifyCounts`
- [ ] Refuses any target other than `bubblydatabase3_staging`
- [ ] Optional `--scrub` flag replaces user emails with `user+<id>@example.test` (so staging never emails real users)
- [ ] Thomas runs it once end to end successfully

### P0-8 🧑 Staging Render service — 30m — DB: none — todo

- [ ] New Render web service, Starter plan, branch `staging`, same build/start commands as prod
- [ ] Env: staging-only `MONGODB_URI`, its own `MY_SECRET`, `WEBSITE_URL` = staging URL, email disabled/sandboxed (`EMAIL_MODE=log`, implemented in P0-9 if needed)
- [ ] Staging URL loads the app with staging data
- [ ] Optional: Render's basic auth or a non-indexed URL so staging stays out of search engines

### P0-9 🤖 Test harness — 45m — DB: none — todo

- [ ] Vitest + supertest + mongodb-memory-server in `server/`
- [ ] `server.js` split so `app` is exportable without listening/connecting
- [ ] `sendEmail` swappable (log mode in test/staging)
- [ ] Root scripts: `npm test`, `npm run dev` (server + client via `concurrently`)
- [ ] One passing health test; `npm test` never touches the network or Atlas

### P0-10 🤖 Smoke tests: signup + login — 45m — DB: none (in-memory) — todo

- [ ] Signup creates a user and returns a token; the email transport is called with a verification URL
- [ ] Login succeeds with the correct password and fails with a wrong one
- [ ] Regression: anonymous `users` and sensitive fields are unavailable (P0-0b)

### P0-11 🤖 Smoke tests: search + product page — 45m — DB: none (in-memory) — todo

- [ ] Fixtures: a few products, users, ratings, reviews
- [ ] `searchGeneralBubblyWater`, `flavors`, `brand` return the expected products
- [ ] `bubblyWater(id)` returns ratings/reviews with no sensitive user fields

### P0-12 🤖 Smoke tests: rate + review — 45m — DB: none (in-memory) — todo

- [ ] An authenticated rate updates `averageRating`; an edit updates it again
- [ ] Review create/edit works for the owner
- [ ] Regression: anonymous or other-user writes are rejected (P0-0c)

### P0-13 🤖 CI — 30m — DB: none — todo

- [ ] `.github/workflows/ci.yml`: install, `npm test`, client build on push/PR
- [ ] Green on `staging`; branch protection on `main` suggested to Thomas

**Phase 0 exit criteria:** hotfix live; a tested restore documented; daily encrypted off-site backups
running; staging refreshable and deployed; smoke tests green in CI.

---

## Phase 1 — Security baseline

#### P1-0 🤖 Image audit — 30m — DB: staging-read

- [ ] Report every image field/URL in products + where the client renders them; list external hosts
- [ ] Classify each: own / user / third-party hotlink
- [ ] Proposal for replacing third-party images with text cards (no data deleted; per hard rule 3)

#### P1-1 🤖 helmet, explicit CORS, body limits — 30m

- [ ] `helmet` with a CSP that allows the current external image hosts (or `img-src https:`) and Formspree
- [ ] `cors` restricted to the site origin(s) via env
- [ ] `express.json({ limit: "100kb" })`; unused `urlencoded` removed
- [ ] Smoke tests still green; site loads on staging with no CSP console errors

#### P1-2 🤖 Rate limiting — 45m

- [ ] Global limiter on `/graphql`
- [ ] Per-operation limits keyed on the GraphQL operation name: `login`, `addUser`, `forgotPassword`, `resetPassword`, `resendEmailVerification`, `addRating`, `editRating`, `addReview`
- [ ] `trust proxy` set correctly for Render; tests prove the 429 behavior

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
