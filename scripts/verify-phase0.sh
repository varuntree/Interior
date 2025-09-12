#!/usr/bin/env bash
set -euo pipefail

echo "Phase 0 verification — typecheck, lint, build, guardrails"

# 1) Build health
echo "→ Typecheck"
npm run -s typecheck
echo "→ Lint"
npm run -s lint
echo "→ Build"
npm run -s build

# 2) Guard checks (fail on violations)
fail_if_found() {
  local pattern="$1"; shift
  local pathspec="$1"; shift
  local msg="$1"; shift || true
  if grep -R -n -E "$pattern" $pathspec >/dev/null 2>&1; then
    echo "✗ ${msg}" >&2
    grep -R -n -E "$pattern" $pathspec || true
    exit 1
  else
    echo "✓ ${msg}"
  fi
}

echo "→ Guardrail scans"
fail_if_found "use server" "app libs" "No Server Actions allowed in app/ or libs/"
fail_if_found "createServerClient" "components" "No direct DB/Supabase server client in components/"
fail_if_found "@supabase/supabase-js" "components" "No Supabase SDK imports in components/ (use API routes)"
fail_if_found "service_role" "app components" "No service_role usage in app/ or components/"
fail_if_found "@/libs/repositories/" "app/api" "Routes must not import repositories directly (use services)"

# Admin client usage restriction: only under webhooks or admin routes
ADMIN_MISUSE=$(grep -R -n "@/libs/supabase/admin" app | grep -v "/api/v1/webhooks/" | grep -v "/api/v1/admin/" || true)
if [ -n "$ADMIN_MISUSE" ]; then
  echo "✗ Admin client used outside webhooks/admin endpoints" >&2
  echo "$ADMIN_MISUSE"
  exit 1
else
  echo "✓ Admin client only used in webhooks/admin"
fi

echo "All Phase 0 checks passed."

