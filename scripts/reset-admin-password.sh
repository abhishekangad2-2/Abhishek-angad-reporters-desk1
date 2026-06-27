#!/usr/bin/env bash
# Turnkey admin password reset. Run this ONE command from the repo root:
#
#   bash scripts/reset-admin-password.sh
#
# It starts the Cloud SQL proxy, pulls the DB connection from Secret Manager,
# then runs the reset script which prompts YOU for the new password (typed in
# your terminal, never logged or transmitted). 2FA is left intact.
#
# Optionally pass a different admin email:  bash scripts/reset-admin-password.sh someone@example.com
set -euo pipefail

PROJECT="abhishek-angad-reporters-desk1"
INSTANCE="${PROJECT}:us-central1:reportersdesk-db"
PORT=5434
EMAIL="${1:-abhishekangad2@gmail.com}"

echo "→ Starting Cloud SQL proxy on 127.0.0.1:${PORT} ..."
cloud-sql-proxy "${INSTANCE}" --port "${PORT}" >/tmp/rd-proxy.log 2>&1 &
PROXY_PID=$!
trap 'kill ${PROXY_PID} 2>/dev/null || true' EXIT

# Wait for the proxy to be ready.
for _ in $(seq 1 30); do
  grep -q "ready for new connections" /tmp/rd-proxy.log 2>/dev/null && break
  sleep 1
done

echo "→ Reading DB credentials from Secret Manager ..."
PASS="$(gcloud secrets versions access latest --secret=database-uri --project "${PROJECT}" \
  | sed 's|postgres://payload:\(.*\)@localhost.*|\1|')"
export DATABASE_URI="postgres://payload:${PASS}@127.0.0.1:${PORT}/payload"

echo "→ Resetting password for: ${EMAIL}"
node "$(dirname "$0")/reset-admin-password.mjs" "${EMAIL}"

echo "→ Done. (proxy will stop automatically)"
