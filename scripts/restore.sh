#!/usr/bin/env bash
# Restore an encrypted backup (made by scripts/backup.sh) into a staging or local database, then
# check that the restored document counts match what mongorestore reported.
#
#   scripts/restore.sh <backup> <target-db>
#
#   <backup>     a local .age file, an object key in R2, or "latest" (newest object in R2)
#   <target-db>  database to restore into. Its matching collections are dropped first. Must be
#                bubblydatabase3_staging, or any database on a local MongoDB. Never production.
#
# Env:
#   AGE_IDENTITY_FILE    path to the age private key file (copy it out of the password manager,
#                        delete it afterwards)
#   RESTORE_MONGODB_URI  server to restore into (default mongodb://127.0.0.1:27017); any database
#                        name in it is ignored
#   SOURCE_DB            database name inside the archive (default: taken from the backup file name)
#   R2_ENDPOINT, R2_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY   (only when reading from R2)
#
# The decrypted archive is streamed straight into mongorestore and never written to disk.
# Works with bash 3.2 (macOS default).

set -euo pipefail
set +x

repo_root="$(cd "$(dirname "$0")/.." && pwd)"

fail() {
  echo "restore: $*" >&2
  exit 1
}

redact() {
  sed -E 's#(mongodb(\+srv)?://)[^@/[:space:]]*@#\1<redacted>@#g'
}

[ $# -eq 2 ] || fail "usage: scripts/restore.sh <backup-file|r2-object-key|latest> <target-db>"
backup="$1"
target="$2"

[ "$target" != "bubblydatabase3" ] || fail "refusing to restore into the production database name"
[[ "$target" =~ ^[A-Za-z0-9_-]+$ ]] || fail "target database name may only use letters, digits, _ and -"
[ -n "${AGE_IDENTITY_FILE:-}" ] || fail "AGE_IDENTITY_FILE is not set (path to the age private key file)"
[ -r "$AGE_IDENTITY_FILE" ] || fail "can't read AGE_IDENTITY_FILE"
[ -d "$repo_root/server/node_modules/mongoose" ] || fail "run 'npm ci' in server/ first (needed to verify counts)"

# Split the server URI so we can point it at the target database without touching credentials
server_uri="${RESTORE_MONGODB_URI:-mongodb://127.0.0.1:27017}"
uri_pattern='^(mongodb(\+srv)?://[^/?]+)(/[^?]*)?(\?.*)?$'
[[ "$server_uri" =~ $uri_pattern ]] || fail "RESTORE_MONGODB_URI is not a valid MongoDB URI"
host_part="${BASH_REMATCH[1]}"
query="${BASH_REMATCH[4]}"
restore_uri="$host_part/$query"
target_uri="$host_part/$target$query"

# Same guard the maintenance scripts use: staging or local only (prints its own reason and exits)
node -e 'require(process.argv[1]).assertStaging(process.argv[2])' \
  "$repo_root/server/scripts/lib/assertStaging.js" "$target_uri"

# Where the backup comes from
if [ -f "$backup" ]; then
  source_desc="local file $backup"
  name="$(basename "$backup")"
else
  for var in R2_ENDPOINT R2_BUCKET AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY; do
    [ -n "${!var:-}" ] || fail "$backup is not a local file, and $var is not set for reading from R2"
  done
  export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-auto}"
  if [ "$backup" = "latest" ]; then
    backup="$(aws s3api list-objects-v2 --bucket "$R2_BUCKET" --endpoint-url "$R2_ENDPOINT" \
      --query 'sort_by(Contents, &LastModified)[-1].Key' --output text)" \
      || fail "couldn't list backups in R2"
    { [ -n "$backup" ] && [ "$backup" != "None" ]; } || fail "no backups found in R2"
  fi
  source_desc="s3://$R2_BUCKET/$backup"
  name="$backup"
fi

# Database name inside the archive, from names like bubblydatabase3-2026-10-22T0817Z.archive.gz.age
name_pattern='^(.+)-[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{4}Z\.archive\.gz\.age$'
if [ -n "${SOURCE_DB:-}" ]; then
  source_db="$SOURCE_DB"
elif [[ "$name" =~ $name_pattern ]]; then
  source_db="${BASH_REMATCH[1]}"
else
  fail "can't tell the source database from \"$name\"; set SOURCE_DB"
fi

fetch() {
  if [ -f "$backup" ]; then
    cat "$backup"
  else
    aws s3 cp "s3://$R2_BUCKET/$backup" - --endpoint-url "$R2_ENDPOINT" --only-show-errors
  fi
}

log="$(mktemp)"
trap 'rm -f "$log"' EXIT

echo "restore: $source_desc (database \"$source_db\") → \"$target\" on $(echo "$host_part" | redact)" >&2
echo "restore: existing collections in \"$target\" that are in the backup will be dropped first" >&2

fetch \
  | age -d -i "$AGE_IDENTITY_FILE" \
  | mongorestore --uri="$restore_uri" --archive --gzip --drop \
      --nsInclude="$source_db.*" --nsFrom="$source_db.*" --nsTo="$target.*" 2>&1 \
  | redact | tee "$log" >&2 \
  || fail "download, decrypt or mongorestore failed"

# Turn "finished restoring <db>.<coll> (N documents, F failures)" lines into expected counts
# (newer tool versions wrap the namespace in backticks)
expected=""
failures=0
while read -r coll count failed; do
  expected="$expected\"$coll\":$count,"
  failures=$((failures + failed))
done < <(sed -nE 's/.*finished restoring `?[^.`]+\.([^ `]+)`? \(([0-9]+) documents?, ([0-9]+) failures?\).*/\1 \2 \3/p' "$log")

[ -n "$expected" ] || fail "mongorestore didn't report restoring any collections"
[ "$failures" -eq 0 ] || fail "mongorestore reported $failures failed documents"
expected="{${expected%,}}"

echo "restore: verifying counts in \"$target\"" >&2
(cd "$repo_root/server" && node scripts/verifyCounts.js "$target_uri" "$expected")
