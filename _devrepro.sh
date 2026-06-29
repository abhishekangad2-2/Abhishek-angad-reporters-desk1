#!/usr/bin/env bash
cd /Users/abhishekangad/reportersdesk-payload
export PAYLOAD_SECRET=dummy
export DATABASE_URI="postgres://u:p@127.0.0.1:5999/none"
export PENDING_2FA_SECRET=dummy
export GCS_BUCKET_NAME=x GCS_PROJECT_ID=x MEDIA_CDN_BASE_URL="https://cdn.x.com"
export VERTEX_PROJECT=x VERTEX_LOCATION=us-central1
export NEXT_TELEMETRY_DISABLED=1
exec npm run dev
