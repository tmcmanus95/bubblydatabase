# BubblyDB — Backup & Restore Runbook

_Last tested: restore path end-to-end on fake data, 2026-10-22. First real production backup: 2026-10-22 01:29 UTC._

## Where everything lives

| What | Where |
|---|---|
| Backups | Cloudflare R2 bucket `bubblydb-backups`, one file per day: `bubblydatabase3-YYYY-MM-DDTHHMMZ.archive.gz.age` |
| Schedule | GitHub Actions → **Database backup** (`.github/workflows/backup.yml`), daily 08:17 UTC, plus a manual "Run workflow" button |
| Retention | 30 days (R2 lifecycle rule) |
| Encryption | `age`. The workflow only has the **public** key (GH secret `AGE_PUBLIC_KEY`) |
| Decryption key | **Only** in Thomas's password manager ("BubblyDB backup key"). Without it, no backup can be read |
| DB credential used | Atlas user `backup-ro`: `read` on `bubblydatabase3`, nothing else |
| Scripts | `scripts/backup.sh`, `scripts/restore.sh`, `server/scripts/verifyCounts.js` |

## Is it working?

- GitHub → Actions → **Database backup**: the latest run is green and less than about a day old. GitHub
  emails you when a scheduled run fails.
- The run log lists each collection (`done dumping … (N documents)`) and ends with
  `backup: uploaded s3://…`. Keep those counts in mind; they're what a restore should reproduce.
- **Public repo caveat:** GitHub disables scheduled workflows after 60 days with no commits. It emails a
  warning first; re-enable it from the Actions tab.

## Monthly restore test (≈10 min, local, never touches Atlas)

Restores the latest backup into a throwaway local MongoDB and checks the counts.

One-time setup:
```sh
brew install age awscli mongodb/brew/mongodb-database-tools   # mongod is already installed
cd <repo>/server && npm ci && cd ..
```

Each time:
```sh
# 1. Throwaway local MongoDB (separate data folder, removed at the end)
mkdir -p /tmp/bubbly-restore-db
mongod --dbpath /tmp/bubbly-restore-db --port 27099 --bind_ip 127.0.0.1 --fork --logpath /tmp/bubbly-restore-db/log

# 2. The private key, copied out of the password manager into a temporary file
pbpaste > /tmp/bubbly-backup.key   # after copying the key note's full text

# 3. R2 read access (same values as the GH secrets; from the password manager)
export R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
export R2_BUCKET="bubblydb-backups"
export AWS_ACCESS_KEY_ID="…"  AWS_SECRET_ACCESS_KEY="…"

# 4. Restore + verify
AGE_IDENTITY_FILE=/tmp/bubbly-backup.key RESTORE_MONGODB_URI=mongodb://127.0.0.1:27099 \
  scripts/restore.sh latest bubblydatabase3_restoretest
```
Expected: a table of collections with counts and indexes, then `OK: counts match`. Compare the counts
with the backup run's log.

No AWS CLI? Download a file from the R2 dashboard (bucket → object → Download) and pass its path
instead of `latest`.

Clean up (the restored copy contains real user data):
```sh
mongosh --port 27099 --quiet --eval 'db.adminCommand({shutdown: 1})' || pkill -f "dbpath /tmp/bubbly-restore-db"
rm -rf /tmp/bubbly-restore-db /tmp/bubbly-backup.key
```

## Refresh staging from the latest backup

Replaces `bubblydatabase3_staging` with the newest production backup, then scrubs user emails.
Uses the staging `MONGODB_URI` from `server/.env`; refuses any other database.

```sh
pbpaste > /tmp/bubbly-backup.key        # age key, copied from the password manager
export AGE_IDENTITY_FILE=/tmp/bubbly-backup.key
export R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com" R2_BUCKET="bubblydb-backups"
export AWS_ACCESS_KEY_ID="…" AWS_SECRET_ACCESS_KEY="…"
npm run staging:refresh                  # or: npm run staging:refresh -- ~/Downloads/<backup>.age
rm /tmp/bubbly-backup.key
```
Expected: the restore table with `OK: counts match`, then `Scrubbed N user emails`, then `done`.

- Afterwards, log in to staging as `user+<your _id>@example.test` with your normal password.
- `--keep-emails` skips the scrub (`npm run staging:refresh -- --keep-emails`). Don't use it while
  staging can send email.
- Collections that exist only in staging (not in the backup) are left as they are.

## Disaster recovery: restoring production (Thomas only)

`scripts/restore.sh` deliberately refuses production. A production restore is done by hand, by Thomas,
with his own Atlas admin user. **Restore into a new database name, then switch the app to it.** That's
reversible, and it keeps the damaged database around for investigation.

1. **Stop the bleeding.** If bad writes are still happening, suspend the Render service (Render →
   service → Settings → Suspend) or put up a maintenance page.
2. **Pick the backup.** Look at R2 (or the Actions run logs) for the newest backup from *before* the
   problem. Download it.
3. **Restore into a new database on Cluster0:**
   ```sh
   age -d -i /tmp/bubbly-backup.key bubblydatabase3-<date>.archive.gz.age \
     | mongorestore --uri="mongodb+srv://<admin-user>:<password>@cluster0.ls0trnd.mongodb.net/" \
         --archive --gzip \
         --nsInclude='bubblydatabase3.*' \
         --nsFrom='bubblydatabase3.*' --nsTo='bubblydatabase3_restored_<yyyymmdd>.*'
   ```
   The last lines should say `N document(s) restored successfully. 0 document(s) failed to restore.`
4. **Check counts** in Atlas → Browse Collections for `bubblydatabase3_restored_<yyyymmdd>`, against the
   backup run's log.
5. **Switch the app:** Render → Environment → `MONGODB_URI`: change only the database name (the part
   after `.mongodb.net/`) to `bubblydatabase3_restored_<yyyymmdd>`. Save, redeploy, and resume the
   service if suspended.
6. **Smoke test:** log in, open a product page, rate something, read a review.
7. **Afterwards:**
   - Update the `backup-ro` user's `read` privilege and the `BACKUP_MONGODB_URI` secret to the new
     database name, or backups keep dumping the old database.
   - Write up what happened in `docs/DECISIONS.md`.
   - Drop the damaged database only once you're sure it isn't needed.
   - Everything written between that backup and the incident is lost (up to about a day).

If the whole Atlas account or cluster is gone: create a new cluster, run step 3 against it (the
`--nsTo` rename is optional), update the host in Render's `MONGODB_URI` and in `BACKUP_MONGODB_URI`,
and recreate `backup-ro`.

## Other incidents

| Problem | Fix |
|---|---|
| Backup run failed | Open the run log. The error is near the end; credentials are redacted. Common causes: Atlas IP access list no longer allows `0.0.0.0/0`, an expired or rotated secret, an R2 token without write access |
| Private key lost | Old backups are unreadable. Run `age-keygen`, put the new public key in `AGE_PUBLIC_KEY`, save the private key, and run the workflow manually right away |
| Private key leaked | Same as lost (new keypair + manual run). Then delete old backups from R2, since whoever has the key can read them |
| R2 token leaked | R2 → Manage API tokens: create a new one (same scope), update `R2_ACCESS_KEY` / `R2_SECRET_ACCESS_KEY`, delete the old token |
| `backup-ro` password leaked | Atlas → Database Access → `backup-ro` → Edit Password, then update `BACKUP_MONGODB_URI` |

## Database migrations

Every schema change ships as a migration in `migrations/` (CLAUDE.md rule 2): a file named
`<YYYYMMDDHHMM>-<what-it-does>.js` exporting `description`, `up(db)` and `down(db)`. Applied ones are
recorded in the `migrations_changelog` collection.

From the repo root, with `server/.env` pointing at staging:

```
npm run migrate:status   # [x] applied, [ ] pending
npm run migrate:up       # applies every pending migration, in order
npm run migrate:down     # reverts the most recent one
```

These refuse any database except `bubblydatabase3_staging` or a local one. **Production (Thomas only):**
take a fresh backup first (the daily backup workflow can be run on demand), confirm the same migration
went up *and* down cleanly on staging, then run with the production URI and the override flag:

```
MONGODB_URI="<production uri>" node server/scripts/migrate.js up --i-am-thomas-on-prod
```

If something goes wrong, `down` with the same flag reverts the last migration; the backup is the fallback.

## Admin roles

Accounts have `role: "user"` or `"admin"` (P1-7). Admin-only operations check the role in the database on
every request, so changes take effect immediately. To make someone an admin (or take it away):

```
node server/scripts/setRole.js <email> admin      # staging (server/.env)
node server/scripts/setRole.js <email> user
MONGODB_URI='<production uri>' node server/scripts/setRole.js <email> admin --i-am-thomas-on-prod
```

The older `ADMIN_USER_IDS` env var still grants admin too. Once your production account has the role,
remove `ADMIN_USER_IDS` from Render so there's one source of truth.
