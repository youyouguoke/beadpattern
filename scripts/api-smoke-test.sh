#!/usr/bin/env bash
set -euo pipefail

# API Smoke Test for BeadPatternAI
# Usage: TEST_ADMIN_API_TOKEN=*** ./scripts/api-smoke-test.sh

API_URL="${TEST_API_URL:-https://api.beadpatternai.com/api}"
ADMIN_URL="${TEST_ADMIN_API_URL:-https://api.beadpatternai.com/api/admin}"
FRONTEND_URL="${TEST_FRONTEND_URL:-https://beadpatternai.com}"
TOKEN="${TEST_ADMIN_API_TOKEN:-}"
if [ -z "$TOKEN" ] && [ -f .env.production ]; then
  TOKEN=$(grep '^NEXT_PUBLIC_ADMIN_API_TOKEN=' .env.production | cut -d '=' -f2-)
fi
if [ -z "$TOKEN" ] && [ -f .env.local ]; then
  TOKEN=$(grep '^NEXT_PUBLIC_ADMIN_API_TOKEN=' .env.local | cut -d '=' -f2-)
fi
PASS=0
FAIL=0

log() {
  echo "[$(date +%H:%M:%S)] $*"
}

fail() {
  log "FAIL: $*"
  FAIL=$((FAIL + 1))
}

pass() {
  log "PASS: $*"
  PASS=$((PASS + 1))
}

json_extract() {
  python3 -c "import json; data=json.load(open('/tmp/resp.json')); print(data$1)"
}

call_public() {
  local path="$1" expect_status="${2:-200}"
  local url="$API_URL$path"
  local status
  status=$(curl -s -o /tmp/resp.json -w "%{http_code}" -H 'Cache-Control: no-cache' "$url")
  if [ "$status" = "$expect_status" ]; then
    pass "$url ($status)"
  else
    fail "$url expected $expect_status got $status"
  fi
}

call_admin() {
  local method="$1" path="$2" expect_status="${3:-200}" body="${4:-}"
  local url="$ADMIN_URL$path"
  local status
  if [ -n "$body" ]; then
    status=$(curl -s -o /tmp/resp.json -w "%{http_code}" \
      -X "$method" \
      -H "Authorization: Bearer $TOKEN " \
      -H 'Content-Type: application/json' \
      -H 'Cache-Control: no-cache' \
      -d "$body" \
      "$url")
  else
    status=$(curl -s -o /tmp/resp.json -w "%{http_code}" \
      -X "$method" \
      -H "Authorization: Bearer $TOKEN " \
      -H 'Cache-Control: no-cache' \
      "$url")
  fi
  if [ "$status" = "$expect_status" ]; then
    pass "$method $url ($status)"
  else
    fail "$method $url expected $expect_status got $status"
  fi
}

log "== Public API =="
call_public "/patterns/cute-panda"
call_public "/recommend/cute-panda"
call_public "/collections/cute-animals"
call_public "/search?q=cat"
call_public "/categories"
call_public "/collections"
call_public "/patterns/cute-panda/download/png"
call_public "/patterns/cute-panda/download/pdf"

log "== Frontend SSR =="
curl -s -o /tmp/resp.html -w "%{http_code}" -H 'Cache-Control: no-cache' "$FRONTEND_URL/pattern/cute-panda?nocache=1" > /tmp/status
if [ "$(cat /tmp/status)" = "200" ] && grep -q 'Related Patterns' /tmp/resp.html; then
  pass "Frontend pattern page contains Related Patterns"
else
  fail "Frontend pattern page"
fi

if [ -n "$TOKEN" ]; then
  log "== Admin API =="
  call_admin GET "/auth"
  call_admin GET "/dashboard"
  call_admin GET "/patterns?limit=1"
  call_admin GET "/settings"
  call_admin PUT "/settings" 200 '{"values":{"site_name":"smoke-test"}}'
  call_admin GET "/seo/sitemap"
  call_admin GET "/seo/metadata"
  call_admin GET "/seo/redirects"

  REDIRECT_OLD="/smoke-old-$(date +%s)"
  REDIRECT_JSON='{"old_path":"'$REDIRECT_OLD'","new_path":"/smoke-new","code":301}'
  call_admin POST "/seo/redirects" 201 "$REDIRECT_JSON"
  REDIRECT_ID=$(json_extract "['data']['id']")
  if [ -n "$REDIRECT_ID" ] && [ "$REDIRECT_ID" != "None" ]; then
    pass "created redirect $REDIRECT_ID"
    call_admin PUT "/seo/redirects/$REDIRECT_ID" 200 '{"old_path":"'$REDIRECT_OLD'-updated"}'
    call_admin DELETE "/seo/redirects/$REDIRECT_ID" 200
  else
    fail "could not extract redirect id"
  fi
else
  log "TEST_ADMIN_API_TOKEN not set, skipping admin API tests"
fi

log "== Summary =="
log "PASS: $PASS, FAIL: $FAIL"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
