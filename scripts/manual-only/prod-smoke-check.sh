#!/usr/bin/env bash
set -u

if [ "${ALLOW_MANUAL_SCRIPT:-}" != "true" ]; then
  echo "Blocked: set ALLOW_MANUAL_SCRIPT=true to run scripts/manual-only/prod-smoke-check.sh"
  exit 1
fi

APP_URL="${APP_URL:-https://esparex.in}"
API_BASE_URL="${API_BASE_URL:-https://api.esparex.in/api/v1}"
ORIGIN="${ORIGIN:-$APP_URL}"

EXPECTED_INDIA_ID="${EXPECTED_INDIA_ID:-694cb5bd579873b99d89f636}"
EXPECTED_GUNTUR_DISTRICT_ID="${EXPECTED_GUNTUR_DISTRICT_ID:-69464c1614759c4fa9b94edd}"
EXPECTED_MACHERLA_ID="${EXPECTED_MACHERLA_ID:-69464c1414759c4fa9b94b64}"

TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-15}"
RUN_MONGO_EXPLAIN="${RUN_MONGO_EXPLAIN:-false}"
MONGO_URI="${MONGO_URI:-}"
LISTING_ID_FOR_EXPLAIN="${LISTING_ID_FOR_EXPLAIN:-69ad023d7da998583c342f0f}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf '[PASS] %s\n' "$1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  printf '[FAIL] %s\n' "$1"
}

warn() {
  WARN_COUNT=$((WARN_COUNT + 1))
  printf '[WARN] %s\n' "$1"
}

run_curl() {
  # Usage:
  # run_curl <name> <url> [<method>] [<extra-header-1>] [<extra-header-2>] ...
  local name="$1"
  local url="$2"
  local method="${3:-GET}"
  shift 3 || true

  local headers_file="${TMP_DIR}/${name}.headers"
  local body_file="${TMP_DIR}/${name}.body"

  local cmd=(curl -sS --max-time "${TIMEOUT_SECONDS}" -D "${headers_file}" -o "${body_file}" -X "${method}" "${url}")
  while [ "$#" -gt 0 ]; do
    cmd+=(-H "$1")
    shift
  done

  if ! "${cmd[@]}"; then
    echo ""
    fail "${name}: request failed (${method} ${url})"
    echo ""
    return 1
  fi
  return 0
}

extract_status() {
  local headers_file="$1"
  awk 'toupper($1) ~ /^HTTP/ { code=$2 } END { print code }' "${headers_file}"
}

check_contains_header() {
  local headers_file="$1"
  local needle="$2"
  if tr -d '\r' < "${headers_file}" | grep -iEq "${needle}"; then
    return 0
  fi
  return 1
}

json_eval() {
  # Usage: json_eval <body-file> <node-expression>
  # node-expression can read parsed JSON as variable `j`
  local body_file="$1"
  local expression="$2"
  node - "${body_file}" "${expression}" <<'NODE'
const fs = require('fs');
const file = process.argv[2];
const expr = process.argv[3];
let j = null;
try {
  j = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch {
  process.stdout.write('');
  process.exit(0);
}
try {
  // eslint-disable-next-line no-eval
  const value = eval(expr);
  process.stdout.write(value == null ? '' : String(value));
} catch {
  process.stdout.write('');
}
NODE
}

echo "=== Production Smoke Check (manual-only) ==="
echo "APP_URL=${APP_URL}"
echo "API_BASE_URL=${API_BASE_URL}"
echo "ORIGIN=${ORIGIN}"
echo ""

# 1) Frontend reachability
run_curl "frontend_home" "${APP_URL}/" "GET" || true
frontend_status="$(extract_status "${TMP_DIR}/frontend_home.headers")"
if [ "${frontend_status}" = "200" ]; then
  pass "Frontend reachable (${APP_URL})"
else
  fail "Frontend reachable expected 200, got ${frontend_status:-none}"
fi

# 2) Backend health + CORS
run_curl "health" "${API_BASE_URL}/health" "GET" "Origin: ${ORIGIN}" || true
health_status="$(extract_status "${TMP_DIR}/health.headers")"
health_success="$(json_eval "${TMP_DIR}/health.body" "j && j.success")"
health_state="$(json_eval "${TMP_DIR}/health.body" "j && j.status")"
if [ "${health_status}" = "200" ] && [ "${health_success}" = "true" ] && [ "${health_state}" = "ok" ]; then
  pass "Backend health endpoint healthy"
else
  fail "Backend health check failed (status=${health_status:-none}, success=${health_success:-none}, state=${health_state:-none})"
fi

if check_contains_header "${TMP_DIR}/health.headers" "^access-control-allow-origin: ${ORIGIN}$"; then
  pass "CORS allow-origin matches ${ORIGIN}"
else
  fail "CORS allow-origin mismatch for ${ORIGIN}"
fi

if check_contains_header "${TMP_DIR}/health.headers" "^access-control-allow-credentials: true$"; then
  pass "CORS allow-credentials enabled"
else
  fail "CORS allow-credentials missing"
fi

# 3) Preflight (OTP verify endpoint)
run_curl "otp_preflight" "${API_BASE_URL}/auth/verify-otp" "OPTIONS" \
  "Origin: ${ORIGIN}" \
  "Access-Control-Request-Method: POST" \
  "Access-Control-Request-Headers: content-type,x-csrf-token" || true
preflight_status="$(extract_status "${TMP_DIR}/otp_preflight.headers")"
if [ "${preflight_status}" = "204" ] || [ "${preflight_status}" = "200" ]; then
  pass "OTP preflight responded (${preflight_status})"
else
  fail "OTP preflight failed (status=${preflight_status:-none})"
fi

# 4) Location checks
run_curl "loc_india" "${API_BASE_URL}/locations?q=India" "GET" || true
india_level="$(json_eval "${TMP_DIR}/loc_india.body" "(j.data||[]).find(x=>x.id==='${EXPECTED_INDIA_ID}')?.level")"
india_verified="$(json_eval "${TMP_DIR}/loc_india.body" "(j.data||[]).find(x=>x.id==='${EXPECTED_INDIA_ID}')?.verificationStatus")"
if [ "${india_level}" = "country" ] && [ "${india_verified}" = "verified" ]; then
  pass "India location is visible and verified"
else
  fail "India location check failed (level=${india_level:-none}, verification=${india_verified:-none})"
fi

run_curl "loc_guntur" "${API_BASE_URL}/locations?q=Guntur" "GET" || true
guntur_level="$(json_eval "${TMP_DIR}/loc_guntur.body" "(j.data||[]).find(x=>x.id==='${EXPECTED_GUNTUR_DISTRICT_ID}')?.level")"
if [ "${guntur_level}" = "district" ]; then
  pass "Guntur (Andhra) is district"
else
  fail "Guntur level check failed (level=${guntur_level:-none})"
fi

run_curl "loc_macherla" "${API_BASE_URL}/locations?q=Macherla" "GET" || true
macherla_parent="$(json_eval "${TMP_DIR}/loc_macherla.body" "(j.data||[]).find(x=>x.id==='${EXPECTED_MACHERLA_ID}')?.parentId")"
if [ "${macherla_parent}" = "${EXPECTED_GUNTUR_DISTRICT_ID}" ]; then
  pass "Macherla parent is Guntur district"
else
  fail "Macherla parent check failed (parent=${macherla_parent:-none})"
fi

# 5) Hierarchy-based ad totals
run_curl "ads_guntur_district" "${API_BASE_URL}/ads?locationId=${EXPECTED_GUNTUR_DISTRICT_ID}&level=district&page=1&limit=20" "GET" || true
guntur_total="$(json_eval "${TMP_DIR}/ads_guntur_district.body" "j.pagination?.total")"

run_curl "ads_macherla_city" "${API_BASE_URL}/ads?locationId=${EXPECTED_MACHERLA_ID}&level=city&page=1&limit=20" "GET" || true
macherla_total="$(json_eval "${TMP_DIR}/ads_macherla_city.body" "j.pagination?.total")"

if [ -n "${guntur_total}" ] && [ -n "${macherla_total}" ] && [ "${guntur_total}" -ge "${macherla_total}" ]; then
  pass "District query includes city inventory (district=${guntur_total}, city=${macherla_total})"
else
  fail "Hierarchy ad total check failed (district=${guntur_total:-none}, city=${macherla_total:-none})"
fi

# 6) Report endpoint auth gate (with CSRF, no auth token => expect 401/403)
run_curl "csrf_bootstrap" "${API_BASE_URL}/csrf-token" "GET" "Origin: ${ORIGIN}" || true
csrf_token="$(json_eval "${TMP_DIR}/csrf_bootstrap.body" "j.csrfToken || j.data?.csrfToken")"
if [ -z "${csrf_token}" ]; then
  fail "CSRF bootstrap token missing"
else
  # Use a cookie jar to preserve CSRF cookie while intentionally omitting auth cookie/token.
  curl -sS --max-time "${TIMEOUT_SECONDS}" -c "${TMP_DIR}/cookies.txt" -o /dev/null "${API_BASE_URL}/csrf-token" >/dev/null 2>&1 || true
  curl -sS --max-time "${TIMEOUT_SECONDS}" -D "${TMP_DIR}/reports_unauth.headers" -o "${TMP_DIR}/reports_unauth.body" \
    -b "${TMP_DIR}/cookies.txt" \
    -X POST "${API_BASE_URL}/reports" \
    -H "Origin: ${ORIGIN}" \
    -H "Content-Type: application/json" \
    -H "x-csrf-token: ${csrf_token}" \
    --data "{\"adId\":\"${EXPECTED_MACHERLA_ID}\",\"adTitle\":\"smoke\",\"reason\":\"OTHER\",\"additionalDetails\":\"smoke\",\"description\":\"smoke\"}" >/dev/null 2>&1 || true

  reports_status="$(extract_status "${TMP_DIR}/reports_unauth.headers")"
  if [ "${reports_status}" = "401" ] || [ "${reports_status}" = "403" ]; then
    pass "Reports endpoint auth gate OK (${reports_status} without auth token)"
  else
    fail "Reports endpoint auth gate unexpected status (${reports_status:-none}, expected 401/403)"
  fi
fi

# 7) Optional Mongo explain checks
if [ "${RUN_MONGO_EXPLAIN}" = "true" ]; then
  if [ -z "${MONGO_URI}" ]; then
    warn "RUN_MONGO_EXPLAIN=true but MONGO_URI not provided; skipping explain checks"
  elif ! command -v mongosh >/dev/null 2>&1; then
    warn "RUN_MONGO_EXPLAIN=true but mongosh is not installed; skipping explain checks"
  else
    echo ""
    echo "Mongo explain checks:"
    mongosh --quiet "${MONGO_URI}" --eval "
      const detail = db.ads.find(
        { _id: ObjectId('${LISTING_ID_FOR_EXPLAIN}'), status: 'live' },
        { title:1, price:1, sellerId:1, location:1, categoryId:1, brandId:1, modelId:1, createdAt:1 }
      ).explain('executionStats');
      printjson({
        listingDetailPlan: detail?.queryPlanner?.winningPlan?.stage || detail?.queryPlanner?.winningPlan?.inputStage?.stage,
        listingDetailTimeMs: detail?.executionStats?.executionTimeMillis,
        listingDetailDocsExamined: detail?.executionStats?.totalDocsExamined,
        listingDetailReturned: detail?.executionStats?.nReturned
      });
    " || warn "Mongo explain execution failed"
  fi
fi

echo ""
echo "=== Summary ==="
echo "Pass: ${PASS_COUNT}"
echo "Fail: ${FAIL_COUNT}"
echo "Warn: ${WARN_COUNT}"

if [ "${FAIL_COUNT}" -gt 0 ]; then
  exit 1
fi

exit 0
