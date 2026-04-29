#!/bin/bash
set -e

echo "🛡️ Starting Esparex Monorepo CI Guardrails..."

USER_BE="user-backend/src"
ADMIN_BE="admin-backend/src"
CORE="core/src"

fail() {
    echo -e "\n❌ FAILURE: $1\n"
    exit 1
}

echo "==> [1/8] Duplicate Logic Guard..."
# Checking for exact implementation exports
LPG_IMPL=$(grep -rnw "export const lifecyclePolicyHttpGuard =" $USER_BE $ADMIN_BE $CORE 2>/dev/null | wc -l | tr -d ' ')
if [ "$LPG_IMPL" -gt 1 ]; then fail "Multiple 'lifecyclePolicyHttpGuard' implementations detected! Only 1 is allowed in @core."; fi

IDEMP_IMPL=$(grep -rnw "export const idempotencyMiddleware = async" $USER_BE $ADMIN_BE $CORE 2>/dev/null | wc -l | tr -d ' ')
if [ "$IDEMP_IMPL" -gt 1 ]; then fail "Multiple 'idempotencyMiddleware' implementations detected! Only 1 is allowed in @core."; fi

echo "==> [2/8] Admin Route Leak Guard..."
# Look for /api/admin mounts inside user-backend routes
LEAK=$(grep -rn "/api/admin" $USER_BE/routes 2>/dev/null || true)
if [ -n "$LEAK" ]; then fail "Admin route leakage in user-backend routes:\n$LEAK"; fi

echo "==> [3/8] Cross-Import Guard..."
# Ensure workspaces use aliases (@core, @shared) instead of relative source imports
CROSS=$(grep -rn "\.\./core/src\|\.\./shared/src" $USER_BE $ADMIN_BE 2>/dev/null || true)
if [ -n "$CROSS" ]; then fail "Illegal cross-imports from source folders found (use @core or @shared aliases):\n$CROSS"; fi

echo "==> [4/8] Middleware SSOT Guard..."
# Ensure any middleware file in user/admin backends that mirrors core is strictly a shim
for f in $(find $USER_BE/middleware $ADMIN_BE/middleware -name "idempotency.ts" -o -name "lifecyclePolicyGuard.ts" 2>/dev/null); do
    if ! grep -q "export {" "$f"; then
        fail "Middleware file $f is not a pure shim! Implementations must live exclusively in @core/middleware/"
    fi
done

echo "==> [5/8] Auth Security Guard..."
node scripts/validate-auth.js || fail "Auth validation script failed."

echo "==> [6/8] Orphan Route Guard..."
# Ensure all defined route files in user-backend are actually mounted
for route_file in $(find $USER_BE/routes -type f -name "*.ts" 2>/dev/null); do
    basename=$(basename "$route_file" .ts)
    if ! grep -q "$basename" $USER_BE/app.ts && [ "$basename" != "index" ]; then
        fail "Orphan route detected: $route_file is defined but not imported in user-backend/src/app.ts"
    fi
done

echo "==> [7/8] Dependency Consistency Guard..."
# Requires syncpack to ensure dependency parity across the monorepo
npx syncpack list-mismatches || fail "Dependency mismatches found across workspaces! Run 'npx syncpack fix-mismatches' to resolve."

echo "==> [8/8] Build Integrity Guard..."
npm run build || fail "Workspace build failed! Ensure strict type-checking and compilation pass."

echo -e "\n✅ ALL CI GUARDS PASSED. Safe to proceed with deployment."
