#!/usr/bin/env bash
# Encrypted MongoDB backup, uploaded to Cloudflare R2 (S3 API).
#
#   scripts/backup.sh                     dump → encrypt → upload to R2
#   scripts/backup.sh --local-only DIR    dump → encrypt into DIR, no upload (dry runs)
#
# Env:
#   BACKUP_MONGODB_URI   connection string including the database name (use a read-only user)
#   AGE_PUBLIC_KEY       age recipient (age1...). The private key never touches this script.
#   BACKUP_PREFIX        file name prefix (default: the database name from the URI)
#   MIN_BACKUP_BYTES     smallest acceptable encrypted file (default 10240)
#   R2_ENDPOINT, R2_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY   (upload mode only)
#
# The plaintext dump only ever exists in the pipe between mongodump and age; it is never written to
# disk. The connection string is never printed.
# Works with bash 3.2 (macOS default).

set -euo pipefail
set +x

fail() {
  echo "backup: $*" >&2
  exit 1
}

# Hide credentials in anything a tool prints, e.g. mongodb+srv://user:pass@host → mongodb+srv://<redacted>@host
redact() {
  sed -E 's#(mongodb(\+srv)?://)[^@/[:space:]]*@#\1<redacted>@#g'
}

LOCAL_DIR=""
if [ "${1:-}" = "--local-only" ]; then
  LOCAL_DIR="${2:-}"
  [ -n "$LOCAL_DIR" ] || fail "--local-only needs a directory"
  [ -d "$LOCAL_DIR" ] || fail "directory not found: $LOCAL_DIR"
elif [ -n "${1:-}" ]; then
  fail "unknown argument: $1"
fi

[ -n "${BACKUP_MONGODB_URI:-}" ] || fail "BACKUP_MONGODB_URI is not set"
[ -n "${AGE_PUBLIC_KEY:-}" ] || fail "AGE_PUBLIC_KEY is not set"
case "$AGE_PUBLIC_KEY" in
  age1*) ;;
  *) fail "AGE_PUBLIC_KEY doesn't look like an age public key (age1...)" ;;
esac
if [ -z "$LOCAL_DIR" ]; then
  for var in R2_ENDPOINT R2_BUCKET AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY; do
    [ -n "${!var:-}" ] || fail "$var is not set"
  done
fi

# Require an explicit database name so we never dump "everything this user can see" by accident
uri_pattern='^mongodb(\+srv)?://[^/]+/([^/?]+)'
if [[ "$BACKUP_MONGODB_URI" =~ $uri_pattern ]]; then
  db_name="${BASH_REMATCH[2]}"
else
  fail "BACKUP_MONGODB_URI must include a database name (mongodb+srv://.../<db>)"
fi

prefix="${BACKUP_PREFIX:-$db_name}"
min_bytes="${MIN_BACKUP_BYTES:-10240}"
name="${prefix}-$(date -u +%Y-%m-%dT%H%MZ).archive.gz.age"

if [ -n "$LOCAL_DIR" ]; then
  out="$LOCAL_DIR/$name"
else
  work_dir="$(mktemp -d)"
  trap 'rm -rf "$work_dir"' EXIT
  out="$work_dir/$name"
fi

echo "backup: dumping database \"$db_name\" → $name"
mongodump --uri="$BACKUP_MONGODB_URI" --archive --gzip 2> >(redact >&2) \
  | age -r "$AGE_PUBLIC_KEY" > "$out" \
  || { rm -f "$out"; fail "mongodump or age failed; nothing kept or uploaded"; }

size="$(wc -c < "$out" | tr -d ' ')"
if [ "$size" -lt "$min_bytes" ]; then
  rm -f "$out"
  fail "encrypted backup is only $size bytes (minimum $min_bytes); refusing to keep it"
fi
if [ "$(head -c 21 "$out")" != "age-encryption.org/v1" ]; then
  rm -f "$out"
  fail "output is not an age-encrypted file"
fi
echo "backup: encrypted archive is $size bytes"

if [ -n "$LOCAL_DIR" ]; then
  echo "backup: saved $out (no upload: --local-only)"
  exit 0
fi

export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-auto}"
aws s3 cp "$out" "s3://$R2_BUCKET/$name" --endpoint-url "$R2_ENDPOINT" --only-show-errors 2>&1 | redact >&2 \
  || fail "upload to R2 failed"
aws s3api head-object --bucket "$R2_BUCKET" --key "$name" --endpoint-url "$R2_ENDPOINT" > /dev/null \
  || fail "upload could not be verified in R2"
echo "backup: uploaded s3://$R2_BUCKET/$name"
