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

## P0-3 (backup script): PR open
- `scripts/backup.sh` (usage in its header) + `scripts/test/backup.test.js`.
- **Thomas's dry run against staging** (also creates the real age key for P0-4):
  ```sh
  brew install age                      # mongodump is already installed
  age-keygen -o ~/bubbly-backup.key     # prints "Public key: age1..."; save this file in your password manager
  cd <repo on main>
  export BACKUP_MONGODB_URI="$(grep '^MONGODB_URI' server/.env | cut -d= -f2-)"   # staging
  export AGE_PUBLIC_KEY="age1..."       # from age-keygen
  mkdir -p ~/bubbly-backup-test && scripts/backup.sh --local-only ~/bubbly-backup-test
  age -d -i ~/bubbly-backup.key ~/bubbly-backup-test/*.age > ~/bubbly-backup-test/plain.archive
  xxd -l 4 ~/bubbly-backup-test/plain.archive   # should show "6de2 9981" (mongodump archive magic number)
  rm -rf ~/bubbly-backup-test           # it holds a plaintext copy of staging (real user emails)
  ```
  Then keep the key file only in the password manager (delete `~/bubbly-backup.key`).

## Next Claude ticket
P0-5 (backup GitHub Actions workflow). It can be built now; it only runs once Thomas finishes P0-4.
