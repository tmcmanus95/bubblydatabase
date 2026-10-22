# Handoff

_Last session: 2026-10-21._

## State
- Docs are committed to `main` by P0-2 (except `docs/AUDIT.md`, which stays local and gitignored).
- Roadmap: **fully approved by Thomas (2026-10-21)**, including his image-use additions (hard rules
  10–11 in CLAUDE.md, the DECISIONS entry, P1-0).
- Prod Atlas password rotated by Thomas (P0-0a done).

## Open P0-0e items (Thomas)
- [ ] Prod confirmation by Thomas: logged out, `users`/`removeUser` are refused; logged in, rating/review/like still work.
  (Claude's anonymous checks passed on 2026-10-21 23:59 UTC; Thomas is doing the logged-in check himself.)
- [ ] Merge `main` into `new-aesthetic`. Known conflict in `server/schemas/resolvers.js` (like resolvers + the
  uncommitted WIP in that file). Wait until the WIP is committed or set aside; Claude can resolve it.

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
- **Docs source of truth is `docs/` on `main`.** Claude updates docs through PRs and mirrors them into
  the `new-aesthetic` folder's untracked copies so they stay readable there. Before merging `main` into
  `new-aesthetic`, move `docs/AUDIT.md` somewhere safe and delete the other untracked docs (git refuses
  to overwrite untracked files); put `AUDIT.md` back after.

## Watch out
- The repo is public. Never paste secrets; PR/commit text is visible to everyone.
- The `new-aesthetic` checkout doesn't have P0-1 yet: don't run anything in its `server/seeders/` until
  `main` is merged in.
- Root `npm run dev` / `npm test` and `migrate:*` don't exist yet (P0-9, P1-11). `server/` has `npm test`.

## Next Claude ticket
P0-3 (backup script).
