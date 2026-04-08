#!/usr/bin/env bash
set -euo pipefail

if [ "${ALLOW_MANUAL_SCRIPT:-}" != "true" ]; then
  echo "Blocked: set ALLOW_MANUAL_SCRIPT=true to run scripts/health-check.sh"
  exit 1
fi

BACKEND_HEALTH_URL="${BACKEND_HEALTH_URL:-http://localhost:5001/api/v1/health}"
USER_FRONTEND_URL="${USER_FRONTEND_URL:-http://localhost:3000}"
ADMIN_FRONTEND_URL="${ADMIN_FRONTEND_URL:-http://localhost:3001}"
USER_MONGO_URI="${USER_MONGO_URI:-mongodb://localhost:27017/esparex_user}"
ADMIN_MONGO_URI="${ADMIN_MONGO_URI:-mongodb://localhost:27017/esparex_admin}"
REDIS_HOST="${REDIS_HOST:-127.0.0.1}"
REDIS_PORT="${REDIS_PORT:-6379}"

echo "=== Esparex Manual Health Check ==="

check_http() {
  local label="$1"
  local url="$2"
  local expected="${3:-}"

  echo ""
  echo "${label}: ${url}"
  if ! response="$(curl -sS "${url}" 2>/dev/null)"; then
    echo "fail: request error"
    return 1
  fi

  if [ -n "${expected}" ] && ! printf "%s" "${response}" | rg -q "${expected}"; then
    echo "fail: response did not contain expected pattern '${expected}'"
    return 1
  fi

  echo "ok"
  return 0
}

check_http "Backend health" "${BACKEND_HEALTH_URL}" "\"status\":\"ok\"" || true
check_http "User frontend" "${USER_FRONTEND_URL}" || true
check_http "Admin frontend" "${ADMIN_FRONTEND_URL}" || true

echo ""
echo "MongoDB user DB:"
if command -v mongosh >/dev/null 2>&1; then
  mongosh "${USER_MONGO_URI}" --quiet --eval \
    'printjson({ ads: db.ads.countDocuments({ status: "live" }), users: db.users.countDocuments() })' || true
else
  echo "warn: mongosh not installed"
fi

echo ""
echo "MongoDB admin DB:"
if command -v mongosh >/dev/null 2>&1; then
  mongosh "${ADMIN_MONGO_URI}" --quiet --eval \
    'printjson({ admins: db.admins.countDocuments(), activeAdmins: db.admins.countDocuments({ isActive: true }) })' || true
else
  echo "warn: mongosh not installed"
fi

echo ""
echo "Redis:"
if command -v redis-cli >/dev/null 2>&1; then
  redis-cli -h "${REDIS_HOST}" -p "${REDIS_PORT}" ping || true
else
  echo "warn: redis-cli not installed"
fi

echo ""
echo "Manual health check complete."
