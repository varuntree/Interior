#!/usr/bin/env bash
set -euo pipefail

echo "== Phase 10 verification: observability guards =="

fail=0

err() { echo "[FAIL] $1" >&2; fail=1; }
ok() { echo "[OK] $1"; }

# 1) Disallow console.* in server code (allow logger implementation)
echo "-- Checking for console.* in server code..."
CONS=$(grep -R -nE "console\.(log|error|warn)\(" app/api libs/services libs/repositories libs/api-utils libs/stripe.ts libs/observability 2>/dev/null | grep -v "libs/observability/logger.ts" || true)
if [ -n "$CONS" ]; then
  echo "$CONS" >&2
  err "Found console.* in server code"
else
  ok "No console.* in server code"
fi

# 2) Ensure all v1 routes are wrapped with withRequestContext (excluding admin for now)
echo "-- Checking v1 routes for withRequestContext..."
missing=()
while IFS= read -r f; do
  if ! grep -q "withRequestContext" "$f"; then
    missing+=("$f")
  fi
done < <(find app/api/v1 -type f -name route.ts | grep -v "/admin/")

if [ ${#missing[@]} -gt 0 ]; then
  printf '%s\n' "${missing[@]}" >&2
  err "Some v1 routes are not using withRequestContext"
else
  ok "All v1 routes wrapped with withRequestContext"
fi

# 3) No raw Response.json({ success: false in v1 routes
echo "-- Checking for raw error JSON in v1 routes..."
RAW=$(grep -R -n "Response\.json({ success: false" app/api/v1 2>/dev/null || true)
if [ -n "$RAW" ]; then
  echo "$RAW" >&2
  err "Found raw error JSON; use fail() instead"
else
  ok "No raw error JSON in v1 routes"
fi

# 4) Run typecheck/lint/build (optional; ignore failures if not configured)
echo "-- Running typecheck/lint/build (optional)..."
npm run -s typecheck || true
npm run -s lint || true
npm run -s build || true

if [ $fail -ne 0 ]; then
  exit 1
fi

echo "== Phase 10 verification: all checks passed =="

