#!/usr/bin/env node

/**
 * 🛡️ Esparex Architecture Governance: Location Architecture & SSOT Guard
 *
 * Enforces:
 * 1. Zero duplicate reverse-geocode admin routes (/locations/reverse-geocode).
 * 2. Zero references to dead cache keys (nearbyCity, NEARBY_LOOKUP).
 * 3. Zero multi-tab sync listeners listening to non-canonical storage keys (esparex_app_location).
 * 4. Zero orphaned auto-detect ingest routes (/locations/ingest).
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const violations = [];

console.log('🛡️  Running Location Architecture & SSOT Guard...\n');

// 1. Check for legacy/duplicate reverse-geocode admin route
try {
    const reverseGeocodeRoutes = execSync(
        "git grep -n 'locations/reverse-geocode' -- 'backend/api/src/routes/' 'core/src/' || true",
        { cwd: ROOT, encoding: 'utf8' }
    ).trim();
    if (reverseGeocodeRoutes) {
        violations.push(`Duplicate reverse-geocode admin route detected:\n${reverseGeocodeRoutes}`);
    }
} catch (error) {
    violations.push(`Failed to check reverse-geocode routes: ${error.message}`);
}

// 2. Check for dead cache keys/constants
try {
    const deadCacheKeys = execSync(
        "git grep -n -E 'nearbyCity|NEARBY_LOOKUP' -- 'core/src/' 'backend/api/src/' || true",
        { cwd: ROOT, encoding: 'utf8' }
    ).trim();
    if (deadCacheKeys) {
        violations.push(`Dead cache keys or constants detected:\n${deadCacheKeys}`);
    }
} catch (error) {
    violations.push(`Failed to check cache keys: ${error.message}`);
}

// 3. Check for non-canonical multi-tab location storage listeners
try {
    const wrongStorageKeys = execSync(
        "git grep -n '\"esparex_app_location\"' -- 'apps/web/src/' || true",
        { cwd: ROOT, encoding: 'utf8' }
    ).trim();
    if (wrongStorageKeys) {
        violations.push(`Non-canonical storage key 'esparex_app_location' detected:\n${wrongStorageKeys}`);
    }
} catch (error) {
    violations.push(`Failed to check storage keys: ${error.message}`);
}

// 4. Check for orphaned auto-detect ingest route
try {
    const ingestRoutes = execSync(
        "git grep -n '\"/ingest\"' -- 'backend/api/src/routes/locationRoutes.ts' || true",
        { cwd: ROOT, encoding: 'utf8' }
    ).trim();
    if (ingestRoutes) {
        violations.push(`Orphaned /ingest route detected in locationRoutes.ts:\n${ingestRoutes}`);
    }
} catch (error) {
    violations.push(`Failed to check ingest routes: ${error.message}`);
}

if (violations.length > 0) {
    console.error('❌ Location Architecture Guard Violations Found:\n');
    violations.forEach((v) => console.error(`  • ${v}`));
    process.exit(1);
} else {
    console.log('✅ Location Architecture Guard Passed: All SSOT contracts and canonical routes strictly enforced.');
    process.exit(0);
}
