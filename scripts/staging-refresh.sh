#!/usr/bin/env bash
# Reload the staging database from a production backup, then scrub user emails.
#
#   npm run staging:refresh                          newest backup in R2
#   npm run staging:refresh -- <file.age|r2-key>     a specific backup (e.g. downloaded from the R2 dashboard)
#   npm run staging:refresh -- --keep-emails [...]   skip the email scrub (not recommended)
#
# Target: always the database "bubblydatabase3_staging", on the server named by MONGODB_URI
# (from the environment, else server/.env). Refuses if MONGODB_URI names any other database.
#
# Env (see docs/RUNBOOK.md):
#   AGE_IDENTITY_FILE    path to the age private key file
#   R2_ENDPOINT, R2_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY   (unless restoring a local file)

set -euo pipefail
set +x

STAGING_DB="bubblydatabase3_staging"
repo_root="$(cd "$(dirname "$0")/.." && pwd)"

fail() {
  echo "staging:refresh: $*" >&2
  exit 1
}

scrub=1
backup="latest"
for arg in "$@"; do
  case "$arg" in
    --keep-emails) scrub=0 ;;
    -*) fail "unknown option: $arg" ;;
    *) backup="$arg" ;;
  esac
done

# Staging connection string: environment first, then server/.env (quotes and spaces trimmed)
uri="${MONGODB_URI:-}"
if [ -z "$uri" ] && [ -f "$repo_root/server/.env" ]; then
  uri="$(sed -nE 's/^[[:space:]]*MONGODB_URI[[:space:]]*=[[:space:]]*["'\'']?([^"'\'' ]*)["'\'']?[[:space:]]*$/\1/p' "$repo_root/server/.env" | tail -1)"
fi
[ -n "$uri" ] || fail "MONGODB_URI is not set (environment or server/.env)"

uri_pattern='^mongodb(\+srv)?://[^/?]+/([^/?]*)'
[[ "$uri" =~ $uri_pattern ]] || fail "MONGODB_URI must name a database"
[ "${BASH_REMATCH[2]}" = "$STAGING_DB" ] \
  || fail "MONGODB_URI names database \"${BASH_REMATCH[2]}\"; staging:refresh only ever targets \"$STAGING_DB\""

RESTORE_MONGODB_URI="$uri" "$repo_root/scripts/restore.sh" "$backup" "$STAGING_DB"

if [ "$scrub" -eq 1 ]; then
  (cd "$repo_root/server" && node scripts/scrubStagingEmails.js "$uri")
else
  echo "staging:refresh: --keep-emails: staging now holds real user emails; don't send mail from it" >&2
fi

echo "staging:refresh: done"
