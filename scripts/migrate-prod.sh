#!/usr/bin/env bash
# Apply pending SQL migrations to the PRODUCTION database.
#
#   bash scripts/migrate-prod.sh            # apply pending
#   bash scripts/migrate-prod.sh --status   # show applied/pending only
#
# Starts the Cloud SQL proxy, pulls the DB connection from Secret Manager (so
# the password only ever lives on your machine, never in CI), then runs the
# plain-SQL runner (scripts/migrate.mjs). Requires: gcloud (authed),
# cloud-sql-proxy, and the repo's node_modules (for `pg`). `rd deploy` calls
# this automatically before triggering a deploy.
set -euo pipefail

PROJECT="abhishek-angad-reporters-desk1"
INSTANCE="${PROJECT}:us-central1:reportersdesk-db"
PORT=5432
DIR="$(cd "$(dirname "$0")/.." && pwd)"

command -v cloud-sql-proxy >/dev/null 2>&1 || { echo "✗ cloud-sql-proxy not installed"; exit 1; }

# Pick a free local port so this never collides with another proxy.
for p in 5432 5455 5456 5457 5458; do
  if ! (exec 3<>"/dev/tcp/127.0.0.1/$p") 2>/dev/null; then PORT=$p; break; fi
  exec 3>&- 2>/dev/null || true
done

echo "→ starting Cloud SQL proxy on 127.0.0.1:${PORT} ..."
cloud-sql-proxy "${INSTANCE}" --port "${PORT}" >/tmp/rd-migrate-proxy.log 2>&1 &
PROXY_PID=$!
trap 'kill ${PROXY_PID} 2>/dev/null || true' EXIT
for _ in $(seq 1 30); do
  grep -q "ready for new connections" /tmp/rd-migrate-proxy.log 2>/dev/null && break
  sleep 1
done
grep -q "ready for new connections" /tmp/rd-migrate-proxy.log || { echo "✗ proxy failed to start"; cat /tmp/rd-migrate-proxy.log; exit 1; }

PASS="$(gcloud secrets versions access latest --secret=database-uri --project "${PROJECT}" \
  | sed 's|postgres://payload:\(.*\)@localhost.*|\1|')"
export DATABASE_URI="postgres://payload:${PASS}@127.0.0.1:${PORT}/payload"

node "${DIR}/scripts/migrate.mjs" "$@"
