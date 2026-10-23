# Handoff

_Last session: 2026-10-21._

## State
- Docs are committed to `main` by P0-2 (except `docs/AUDIT.md`, which stays local and gitignored).
- Roadmap: **fully approved by Thomas (2026-10-21)**, including his image-use additions (hard rules
  10–11 in CLAUDE.md, the DECISIONS entry, P1-0).
- Prod Atlas password rotated by Thomas (P0-0a done).

## `new-aesthetic` state (local only, not pushed)
- `321b6a1` WIP snapshot: Thomas's previously uncommitted design work, committed as-is so `main`
  could be merged. Not reviewed.
- `5e517d7` merge of `main` (through #163). The like-resolver conflict was resolved with `main`'s
  `requireUser` version. The old local `config/onRenderConnection.js` was replaced by the retired stub.
- Backup of the pre-merge state: branch `backup/new-aesthetic-pre-merge-2026-10-21`. Delete it once
  Thomas is happy.
- Pre-existing WIP bug (not from the merge): the client's `REMOVE_LIKE_FROM_REVIEW` mutation still sends
  `userId` and asks for user fields, but `new-aesthetic`'s schema returns `LikeResult` with no `userId`
  arg. `ADD_LIKE_TO_REVIEW` was already updated. Fix when the WIP resumes.
- Docs in this folder are now tracked files from `main`; they only update when `main` is merged in
  again. Read the latest on GitHub, or ask Claude to merge `main` in.

## Security hotfix (P0-0b/c/d): merged
- PR #160 merged into `main` as `1ffa11a` (2026-10-21), after Thomas tested it locally against staging.
  `ADMIN_USER_IDS` is set in Render.
- Hotfix worktree and branch deleted (local + remote).
- Deployed to prod. Claude's anonymous checks (2026-10-21 23:59 UTC): logged-out `users` and
  `removeUser` → UNAUTHENTICATED; `passwordResetToken` is no longer in the schema. Open items are listed above.

## P0-1 (quarantine DB scripts): merged (PR #161 → `main` @ `f2f8670`)
- Scripts connect via `server/scripts/lib/stagingConnection.js`, which refuses anything but
  `bubblydatabase3_staging` or a local DB. `seed.js` needs `--yes-drop-staging`.
- `config/onRenderConnection.js` is now a tracked stub that exits. When `main` reaches the
  `new-aesthetic` checkout, git replaces the old local copy (dead password) with the stub, so the five
  local-only scripts (editEntry, deleteRating, updateUsers, deleteBubbly, findReviewsWithRatings) stop
  with a message instead of reaching prod. To use one against staging, change its first `require` to
  `../scripts/lib/stagingConnection`.
- `calculateTopReviews.js` (uncommitted WIP) now requires `stagingConnection`. Until `main` is merged
  into `new-aesthetic`, that file doesn't exist there, so the script fails safely.
- `cd server && npm test` runs the guard tests (no network/DB).

## P0-2 (repo hygiene): merged (PR #162 → `main` @ `39e5f64`)
- `server/.env.example`, root `.gitignore`, `.DS_Store` untracked, `docs/` committed (except
  `AUDIT.md`: local + gitignored by Thomas's decision).
- `staging` branch created from `main` @ `39e5f64`.
- Follow-up PR: `engines.node` = `20.x` (Render reported 20.12.0). Node 20 is end-of-life; the
  upgrade to 22 is tracked in P1-10.
- **Docs source of truth is `docs/` on `main`**, updated through PRs. `docs/AUDIT.md` exists only in
  the `new-aesthetic` folder (gitignored).

## Watch out
- The repo is public. Never paste secrets; PR/commit text is visible to everyone.
- Root `npm run dev` / `npm test` and `migrate:*` don't exist yet (P0-9, P1-11). `server/` has `npm test`.

## P0-3 (backup script): done (PR #164 → `main` @ `089e3f3`)
- `scripts/backup.sh` (usage in its header) + `scripts/test/backup.test.js`.
- Dry run against staging passed (2026-10-21). The age key made for it is the real backup key
  (private key only in Thomas's password manager). Steps, for re-running:
  ```sh
  brew install age                      # mongodump is already installed
  age-keygen -o ~/bubbly-backup.key     # prints "Public key: age1..."; save this file in your password manager
  cd <repo on main>
  export BACKUP_MONGODB_URI="$(grep '^MONGODB_URI' server/.env | cut -d= -f2-)"   # staging
  export AGE_PUBLIC_KEY="age1..."       # from age-keygen
  mkdir -p ~/bubbly-backup-test && scripts/backup.sh --local-only ~/bubbly-backup-test
  age -d -i ~/bubbly-backup.key ~/bubbly-backup-test/*.age > ~/bubbly-backup-test/plain.archive
  xxd -l 4 ~/bubbly-backup-test/plain.archive   # "1f8b 0800": the whole archive is gzipped
  gunzip -c ~/bubbly-backup-test/plain.archive | xxd -l 4   # "6de2 9981": mongodump archive magic number
  rm -rf ~/bubbly-backup-test           # it holds a plaintext copy of staging (real user emails)
  ```
  Then keep the key file only in the password manager (delete `~/bubbly-backup.key`).

## P0-4 (backup infrastructure): done by Thomas (2026-10-22)
- R2 bucket `bubblydb-backups` (30-day delete rule), bucket-scoped R2 token, Atlas `backup-ro` (`read` on
  `bubblydatabase3` only), age keypair (private key only in the password manager), 6 GH secrets.
- The access key secret is named `R2_ACCESS_KEY` (not `_ID`); the workflow maps it.
- Keep credentials out of `server/.env`: it holds staging values only, and editor selections of it get
  sent to Claude. Some R2/Atlas values were shared that way on 2026-10-22; Thomas was advised to
  rotate the R2 token and the `backup-ro` password, and update the matching GH secrets.

## P0-5 (backup workflow): done (PR #166)
- `.github/workflows/backup.yml`: daily at 08:17 UTC plus a manual "Run workflow" button.
- First run (2026-10-22 01:29 UTC) succeeded: 45 users, 159 reviews, 1350 ratings, 442 bubblywaters;
  80 KB encrypted archive in R2.
- Public repos: GitHub disables scheduled workflows after 60 days with no repo activity. It emails a
  warning first; re-enable from the Actions tab.

## P0-6 / P0-7 (restore, staging refresh): done
- Real restore test passed (2026-10-22): the latest prod backup decrypted with Thomas's key and
  restored with matching counts. `staging:refresh` also ran against Atlas staging.
- **Staging logins are now `user+<your _id>@example.test`** with your normal password.
- `bubblydatabase-main` (a sibling folder) is a checkout of `main` with `server/.env` (staging) and
  server deps installed. Run scripts from there. Update it with `git pull`.
- Age key: `~/bubbly-backup.key` still exists. Once it's confirmed in the password manager, delete the file.

## P0-8 (staging Render service): done (2026-10-22)
- Separate Render web service on branch `staging`, database `bubblydatabase3_staging`, `EMAIL_MODE=log`,
  no Gmail credentials. Pushing to `staging` deploys it.
- Its build command installs the client's devDependencies: with `NODE_ENV=production`, plain
  `npm install` skips `vite`. If the build fails with `vite: not found`, the build command needs
  `npm --prefix client install --include=dev`.
- Log in as `user+<your _id>@example.test` (note the `+`) with your normal password.
- **Release flow from now on:** feature PRs → `staging` → check the staging site → PR `staging` → `main`.

## P0-9 (test harness): done (PR #169)
- `npm test` at the root runs everything; `npm run dev` runs server (auto-restart) + client.
- Server tests: `server/tests/*.test.js` with `startTestServer()` from `server/tests/helpers.js`
  (in-memory MongoDB, email captured in `outbox`).
- The lockfile picked up in-range updates of a few transitive production packages (bson, form-data,
  follow-redirects, saslprep, …) while adding the test dependencies. Listed in the PR.

## P0-10..12 (smoke tests): done (PR #171)
- `server/tests/{auth,catalog,ratings}.test.js` + `fixtures.js`: 22 tests over the real GraphQL API on
  an in-memory database. `npm test` now runs 50 tests.
- Tests only; no app code changed, so there's nothing to check on the staging site.

## P0-13 (CI): done (PR #172)
- `.github/workflows/ci.yml` runs all 50 tests (MongoDB 8.0 on the runner, nothing skipped) and the
  client build on every PR and on pushes to `staging`/`main`. No secrets.
- Thomas (optional): Settings → Branches/Rules → require the `test` check on `main` and `staging`.

## Phase 0 wrap-up
- All Phase 0 exit criteria are met once P0-13 merges.
- Released to `main` in #173 (2026-10-22). CI runs on every PR.
- Thomas created a "Tests" ruleset requiring the `test` check. As of 2026-10-22 it was **Disabled** and
  targeted only `main`: set it to Active and add `staging`.

## P1-0 (image audit): done (PR #174)
- `docs/IMAGE_AUDIT.md`. Thomas approved the proposal; it's now tickets P1-0a..e in the roadmap.
- Still waiting on Thomas (P1-0e): where `bubblesicon.png` and the bubble textures came from.

## P1-1 (security headers): done (PR #175)
- `helmet` + CSP header (production only), `CORS_ORIGINS` allowlist, 100kb JSON limit.
- Bug found and fixed: the old `<meta>` CSP in `client/index.html` blocked the Lilita One font on the
  live site, and would block the Formspree contact form.
- `server/.env.example` documents `CORS_ORIGINS` (leave empty unless another site needs the API).
- Verified on staging by Thomas: the font renders and the contact form sends. **Prod still serves the old
  meta CSP (font blocked, contact form broken) until `staging` is released to `main`.**

## CI ruleset
- "Tests" ruleset: Active, requires the `test` check on `main` and `staging` (narrowed from all branches
  on 2026-10-22, after it blocked pushing feature branches).

## P1-0a (brand colors): done (PR #176)
- `client/src/theme/brandColors.js` (+ `color.js` for OKLCH/contrast math). To recolor a brand, edit
  its line in `BRAND_COLORS`; the test enforces gamut and AA contrast.
- Released to prod on 2026-10-22 together with P1-1 (prod now sends the new CSP: font + contact form fixed).

## P1-0b (ProductCard): done (PR #178, follow-up #179)
- `<ProductCard>` (full/compact) + `FlavorIcon` placeholder icons. Not used on real pages yet.
- Follow-up per Thomas: fixed slots for every element, and all flavor colors shown (stripe + chips) via
  `client/src/theme/flavorColors.js` (mirrors App.css; a test keeps them in sync).
- **See it on staging at `/working/cards`** (top 18 bubblies, real data).
- Icons are placeholders drawn in code; Thomas hasn't confirmed this approach yet (DECISIONS).

## P1-0c (swap product images): done (PR #180); flavor-card redesign PR open
- Every product photo is a `<ProductCard>`; no third-party product images load anywhere.
- Redesign per Thomas: flavor colors fill the card (`flavorSurface.js`), brand names in per-brand fonts
  (`brandFonts.js`, 44 Google Fonts; edit a line to swap one), read-only stars (`Stars.jsx`). Brand
  colors removed (`brandColors.js` deleted).
- Check on staging: `/working/cards`, home, a product page, in light and dark mode.
- Second round (PR open): punchier colors, solid flavor pills, bigger brand names, flavor-colored stars.
  Tones per role live in `flavorSurface.js` (`flavorSurface`, `flavorAccent`, `flavorStarColor`); tests
  check contrast and that pills/stars stand out, so tune numbers there and let the tests guard.
- Third round (#183): layout B "Score sticker", colored hover shadow, auto-fit brand names, bigger
  centered stars. **To edit colors:** open `/working/colors` (Color Lab), drag sliders, "Copy settings",
  paste over `DEFAULT_COLOR_SETTINGS` in `client/src/theme/colorSettings.js`, run `npm test`.
- P1-21 decided: tap stars directly on cards (with scroll-safe taps, stars above the link, undo toast).
- Flavor icons removed (#184). Brand border approved (Thomas picked "frame" over "tab"); PR open with the
  mobile overflow/pill fix and 5 background patterns; Thomas picked **waves** as the default (2026-10-23).
- Waves merged (#185). Wave motion PR #186: hover/focus slosh + rising tiny bubbles in the bottom region
  (`flavorBubbles` in `flavorSurface.js`, drawn by `.flavor-surface--waves::before` in `index.css`); respects reduce motion.
- Mobile screenshots: headless Chrome can't make <500px windows, and iframes are blocked by our own CSP
  (frame-ancestors 'none'); use real device emulation (puppeteer-core) for phone checks.

## Next Claude ticket
P1-0d (typographic brand pages in brand fonts, drop logo links, delete dead `Header.jsx`), then
tighten the CSP `img-src` and continue with P1-2 (rate limiting).
