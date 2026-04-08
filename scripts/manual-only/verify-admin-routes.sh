#!/usr/bin/env bash
set -euo pipefail

if [ "${ALLOW_MANUAL_SCRIPT:-}" != "true" ]; then
  echo "Blocked: set ALLOW_MANUAL_SCRIPT=true to run scripts/manual-only/verify-admin-routes.sh"
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SHARED="${REPO_ROOT}/shared/contracts/api/adminRoutes.ts"
BACKEND="${REPO_ROOT}/backend/src/routes/adminRoutes.ts"
COOKIE_HELPER="${REPO_ROOT}/backend/src/utils/cookieHelper.ts"
ADMIN_AUTH="${REPO_ROOT}/backend/src/middleware/adminAuth.ts"
ADMIN_ENV="${REPO_ROOT}/admin-frontend/.env.local"
ADMIN_MONGO_URI="${ADMIN_MONGO_URI:-mongodb://localhost:27017/esparex_admin}"

echo "=== Verifying Admin Route Contract (Manual) ==="
echo "repo: ${REPO_ROOT}"

for required in "${SHARED}" "${BACKEND}" "${COOKIE_HELPER}" "${ADMIN_AUTH}"; do
  if [ ! -f "${required}" ]; then
    echo "missing required file: ${required}"
    exit 1
  fi
done

echo ""
echo "Shared contract LOGIN path:"
rg -n "LOGIN" "${SHARED}" || true

echo ""
echo "Backend login route declarations:"
rg -n "login" "${BACKEND}" || true

echo ""
echo "Backend cookie path options:"
rg -n "path:" "${COOKIE_HELPER}" || true

echo ""
echo "Admin cookie self-clear guard:"
if rg -q "clearCookie.*admin_token.*getAuthCookieOptions" "${ADMIN_AUTH}"; then
  echo "fail: self-clear pattern still present in admin auth middleware"
  exit 1
fi
echo "ok: no self-clear pattern found"

echo ""
echo "Admin frontend API URL:"
if [ -f "${ADMIN_ENV}" ]; then
  rg -n "NEXT_PUBLIC_ADMIN_API_URL" "${ADMIN_ENV}" || true
else
  echo "warn: ${ADMIN_ENV} not found"
fi

echo ""
echo "Admin DB status sample:"
if command -v mongosh >/dev/null 2>&1; then
  mongosh "${ADMIN_MONGO_URI}" --quiet --eval \
    'db.admins.find({},{email:1,isActive:1,status:1,_id:0}).limit(5).forEach(printjson)'
else
  echo "warn: mongosh not installed; skipping admin DB status sample"
fi

echo ""
echo "Manual admin route verification complete."
