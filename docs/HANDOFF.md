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

## P0-6 (restore + runbook): merged (PR #167)
- `scripts/restore.sh` + `server/scripts/verifyCounts.js`; procedures in `docs/RUNBOOK.md`.
- Open: Thomas runs the monthly restore test once against the real latest backup (local mongod).
  He needs `brew install awscli` (or downloads the file from the R2 dashboard) and the R2 keys + age
  key from his password manager.

## P0-7 (`staging:refresh`): PR open
- `npm run staging:refresh` reloads `bubblydatabase3_staging` from the newest R2 backup (or a given
  file), verifies counts, then scrubs emails (default).
- **After a refresh, log in to staging as `user+<your _id>@example.test` with your normal password.**
- Open: Thomas runs it once against Atlas staging (RUNBOOK → Refresh staging).

## Next Claude ticket
P0-9 (test harness: root `npm test` / `npm run dev`, supertest + in-memory Mongo). P0-8 is Thomas's
(staging Render service).
