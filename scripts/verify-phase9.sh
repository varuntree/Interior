#!/usr/bin/env bash
set -euo pipefail

echo "Phase 9 verification — build warnings and client import hygiene"

# 1) Build and fail on warnings
TMP_LOG=$(mktemp)
if npm run -s build | tee "$TMP_LOG" | grep -E "^warn\s+-|Warning:" >/dev/null; then
  echo "✗ Build produced warnings (see lines above)" >&2
  rm -f "$TMP_LOG"
  exit 1
else
  echo "✓ No build warnings detected"
fi
rm -f "$TMP_LOG"

# 2) Check for unintended client imports of removed packages
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

fail_if_found "from 'axios'|from \"axios\"" "components app" "No axios imports in client code"
fail_if_found "from 'react-hot-toast'|from \"react-hot-toast\"" "components app" "No react-hot-toast imports in client code"
fail_if_found "from 'react-syntax-highlighter'|from \"react-syntax-highlighter\"" "components app" "No react-syntax-highlighter imports in client code"
fail_if_found "crisp-sdk-web|Crisp" "components app" "No Crisp references in client code"

echo "All Phase 9 checks passed."
