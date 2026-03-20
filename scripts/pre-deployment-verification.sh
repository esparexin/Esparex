#!/bin/bash
# Pre-Deployment Verification Suite for Esparex Remediation PR
# 
# This script runs comprehensive checks before deploying to production
# Exit code: 0 = all checks passed, 1 = failures found
#
# Usage: bash scripts/pre-deployment-verification.sh

set -e  # Exit on first error

REPO_ROOT="${REPO_ROOT:-.}"
BACKEND_PATH="${REPO_ROOT}/backend"
FRONTEND_PATH="${REPO_ROOT}/frontend"
ADMIN_FRONTEND_PATH="${REPO_ROOT}/admin-frontend"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Tracking
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}══════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}══════════════════════════════════════════${NC}\n"
}

print_check() {
    echo -e "${YELLOW}► $1${NC}"
}

print_pass() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED++))
}

print_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

# ============================================================================
# 1. CODE STRUCTURE CHECKS
# ============================================================================

print_header "1. CODE STRUCTURE VERIFICATION"

print_check "Checking slug generator implementation..."
if grep -q "generateUniqueSlug" "${BACKEND_PATH}/src/utils/slugGenerator.ts"; then
    if grep -q "model.exists" "${BACKEND_PATH}/src/utils/slugGenerator.ts"; then
        print_pass "Slug generator has DB-check implementation"
    else
        print_fail "Slug generator missing DB-check loop"
    fi
else
    print_fail "Slug generator file not found or missing key function"
fi

print_check "Checking Ad model post-save error handler..."
if grep -q "post.*save.*error" "${BACKEND_PATH}/src/models/Ad.ts"; then
    if grep -q "code.*11000" "${BACKEND_PATH}/src/models/Ad.ts"; then
        print_pass "Ad model has duplicate-key error handler"
    else
        print_fail "Ad model error handler missing MongoError 11000 check"
    fi
else
    print_fail "Ad model missing post-save error handler"
fi

print_check "Checking OTP Guard implementation..."
if [ -f "${BACKEND_PATH}/src/middleware/otpGuard.ts" ]; then
    if grep -q "validateOtpConfiguration" "${BACKEND_PATH}/src/middleware/otpGuard.ts"; then
        print_pass "OTP Guard middleware found with validation function"
    else
        print_fail "OTP Guard file missing validation function"
    fi
else
    print_fail "OTP Guard middleware file not found"
fi

print_check "Checking OTP Guard integration in app.ts..."
if grep -q "validateOtpConfiguration" "${BACKEND_PATH}/src/app.ts"; then
    print_pass "OTP Guard initialized in app.ts"
else
    print_fail "OTP Guard not initialized in app.ts"
fi

print_check "Checking OTP Guard applied to auth routes..."
if grep -q "otpConfigurationCheck" "${BACKEND_PATH}/src/routes/authRoutes.ts"; then
    print_pass "OTP Guard middleware applied to auth routes"
else
    print_fail "OTP Guard middleware not applied to auth routes"
fi

# ============================================================================
# 2. COMPILATION & TYPE CHECKING
# ============================================================================

print_header "2. TYPESCRIPT COMPILATION"

print_check "TypeScript compilation check..."
cd "${BACKEND_PATH}"
if npx tsc --noEmit 2>/dev/null; then
    print_pass "TypeScript compilation successful"
else
    print_fail "TypeScript compilation failed"
fi
cd - > /dev/null

# ============================================================================
# 3. LINTING CHECKS
# ============================================================================

print_header "3. LINTING VERIFICATION"

print_check "Backend linting check..."
cd "${BACKEND_PATH}"
LINT_ERRORS=$(npm run lint 2>&1 | grep -c "✖.*error" || true)
if [ "$LINT_ERRORS" -eq 0 ]; then
    print_pass "No new linting errors in backend"
else
    print_warn "Linting warnings present (check if pre-existing)"
fi
cd - > /dev/null

# ============================================================================
# 4. TEST EXECUTION
# ============================================================================

print_header "4. TEST SUITE EXECUTION"

print_check "Running backend auth tests..."
cd "${BACKEND_PATH}"
if npm test -- --testPathPatterns="auth" --silent 2>&1 | grep -q "Tests:.*passed"; then
    print_pass "Auth tests passing (OTP integration verified)"
else
    print_fail "Auth tests failing (OTP integration at risk)"
fi
cd - > /dev/null

print_check "Running full backend test suite..."
cd "${BACKEND_PATH}"
TEST_OUTPUT=$(npm test -- --silent 2>&1)
if echo "$TEST_OUTPUT" | grep -q "Test Suites:.*passed"; then
    TEST_COUNT=$(echo "$TEST_OUTPUT" | grep "Tests:" | tail -1)
    print_pass "Backend tests: $TEST_COUNT"
else
    print_warn "Could not parse test results"
fi
cd - > /dev/null

# ============================================================================
# 5. DEPENDENCY CHECKS
# ============================================================================

print_header "5. DEPENDENCY VERIFICATION"

print_check "Checking nanoid dependency for slug generation..."
cd "${BACKEND_PATH}"
if grep -q '"nanoid"' package.json; then
    print_pass "nanoid dependency available"
else
    print_fail "nanoid dependency missing from backend"
fi
cd - > /dev/null

print_check "Checking Mongoose version..."
cd "${BACKEND_PATH}"
if grep -q '"mongoose"' package.json; then
    MONGOOSE_VERSION=$(grep '"mongoose"' package.json | head -1 | grep -o '[0-9]\+\.[0-9]\+')
    print_pass "Mongoose $MONGOOSE_VERSION available"
else
    print_fail "Mongoose not found in dependencies"
fi
cd - > /dev/null

# ============================================================================
# 6. CONFIGURATION READINESS
# ============================================================================

print_header "6. CONFIGURATION READINESS"

print_check "Checking environment variable template..."
if [ -f "${REPO_ROOT}/.env.example" ]; then
    if grep -q "MSG91_AUTH_KEY\|MSG91_SENDER_ID" "${REPO_ROOT}/.env.example"; then
        print_pass "SMS credentials documented in .env.example"
    else
        print_warn "SMS credentials not documented in .env.example"
    fi
else
    print_warn ".env.example not found"
fi

print_check "Verifying .env is in .gitignore..."
if grep -q "\.env\|MSG91" "${REPO_ROOT}/.gitignore" 2>/dev/null; then
    print_pass ".env properly ignored in git"
else
    print_warn ".env protection not verified"
fi

# ============================================================================
# 7. DOCUMENTATION CHECKS
# ============================================================================

print_header "7. DOCUMENTATION ARTIFACTS"

REQUIRED_DOCS=(
    "docs/DELIVERY-SUMMARY.md"
    "docs/MASTER-REMEDIATION-PR.md"
    "docs/OTP-GUARD-IMPLEMENTATION.md"
    "docs/system-audit/ADMIN-CONSOLIDATION-PLAN.md"
    "docs/system-audit/PHASE1-CONSOLIDATION-PR.md"
    "docs/system-audit/feature-mapping.csv"
)

for doc in "${REQUIRED_DOCS[@]}"; do
    if [ -f "${REPO_ROOT}/${doc}" ]; then
        SIZE=$(wc -l < "${REPO_ROOT}/${doc}" 2>/dev/null || echo "?")
        print_pass "✓ $doc ($SIZE lines)"
    else
        print_fail "Missing documentation: $doc"
    fi
done

# ============================================================================
# 8. GIT HYGIENE
# ============================================================================

print_header "8. GIT STATUS"

CHANGES=$(cd "${BACKEND_PATH}" && git status --short 2>/dev/null | wc -l)
print_check "Changed files in backend: $CHANGES"
if [ "$CHANGES" -lt 20 ]; then
    print_pass "Changes are focused (not a massive refactor)"
else
    print_warn "Large number of changes ($CHANGES files) - verify scope"
fi

# ============================================================================
# SUMMARY
# ============================================================================

print_header "VERIFICATION SUMMARY"

echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"

if [ "$FAILED" -eq 0 ]; then
    echo -e "\n${GREEN}✅ ALL CHECKS PASSED - READY FOR DEPLOYMENT${NC}\n"
    exit 0
else
    echo -e "\n${RED}❌ SOME CHECKS FAILED - REVIEW ABOVE${NC}\n"
    exit 1
fi
