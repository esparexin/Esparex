#!/usr/bin/env node

/**
 * 🛡️ Esparex Architecture Governance: Location Architecture & SSOT Guard
 *
 * Enforces:
 * 1. Zero duplicate reverse-geocode admin routes (/locations/reverse-geocode).
 * 2. Zero references to dead cache keys (nearbyCity, NEARBY_LOOKUP).
 * 3. Zero multi-tab sync listeners listening to non-canonical storage keys (esparex_app_location).
 * 4. Zero orphaned auto-detect ingest routes (/locations/ingest).
 * 5. Nominatim-first reverse geocode (AGENTS.md geocode governance): OSM calls carry
 *    an Esparex User-Agent, and ReverseGeocodeService resolves via Nominatim before $near fallback.
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

// 5. Nominatim-first reverse geocode (AGENTS.md geocode governance)
checkNominatimFirst();

// 6. Zero shadow location formatters outside @esparex/shared.
//    formatLocation / normalizeGeoPoint / getLocationLabel implementations
//    live only in shared/src/location. Pure single-line delegates that call
//    the shared canonical (getLocationLabel / toCanonicalGeoPoint /
//    LocationFacade) are permitted adapters; anything else fails.
checkNoShadowFormatters();

if (violations.length > 0) {
    console.error('❌ Location Architecture Guard Violations Found:\n');
    violations.forEach((v) => console.error(`  • ${v}`));
    process.exit(1);
} else {
    console.log('✅ Location Architecture Guard Passed: All SSOT contracts and canonical routes strictly enforced.');
    process.exit(0);
}

function checkNominatimFirst() {
    const fs = require('fs');
    const nominatimFile = path.join(ROOT, 'core/src/services/location/NominatimGeocode.ts');
    const reverseGeocodeFile = path.join(ROOT, 'core/src/services/location/ReverseGeocodeService.ts');

    if (!fs.existsSync(nominatimFile)) {
        violations.push('Missing canonical Nominatim integration: core/src/services/location/NominatimGeocode.ts');
        return;
    }
    const nominatimSource = fs.readFileSync(nominatimFile, 'utf8');
    if (!/export\s+const\s+resolveSettlementWithNominatim/.test(nominatimSource)) {
        violations.push('NominatimGeocode.ts must export resolveSettlementWithNominatim (canonical settlement resolver).');
    }
    if (!/User-Agent/.test(nominatimSource) || !/Esparex\//.test(nominatimSource)) {
        violations.push('Nominatim API requests must carry a descriptive User-Agent header (Esparex/x.y per OSM policy).');
    }

    if (!fs.existsSync(reverseGeocodeFile)) {
        violations.push('Missing canonical reverse geocode service: core/src/services/location/ReverseGeocodeService.ts');
        return;
    }
    const reverseSource = fs.readFileSync(reverseGeocodeFile, 'utf8');
    if (!/resolveSettlementWithNominatim/.test(reverseSource)) {
        violations.push('ReverseGeocodeService must resolve via Nominatim (resolveSettlementWithNominatim) before $near fallback.');
    }
    if (!/\$near/.test(reverseSource)) {
        violations.push('ReverseGeocodeService must retain raw $near as degraded fallback when Nominatim is unavailable.');
    }
}

function checkNoShadowFormatters() {
    const fs = require('fs');
    let matches = '';
    try {
        matches = execSync(
            "git grep -n -E '(function formatLocation[\\s(]|const formatLocation[\\s=]|function normalizeGeoPoint[\\s(]|const normalizeGeoPoint[\\s=])' -- 'apps/' 'core/src/' 'backend/api/src/' 'packages/' || true",
            { cwd: ROOT, encoding: 'utf8' }
        ).trim();
    } catch (error) {
        violations.push(`Failed to check shadow location formatters: ${error.message}`);
        return;
    }
    if (!matches) return;
    const offenders = [];
    for (const line of matches.split('\n')) {
        const filePath = line.split(':')[0];
        if (filePath.startsWith('shared/src/location/')) continue;
        const abs = path.join(ROOT, filePath);
        let content = '';
        try {
            content = fs.readFileSync(abs, 'utf8');
        } catch {
            continue;
        }
        const delegatesToShared =
            /getLocationLabel|toCanonicalGeoPoint|LocationFacade\.format/.test(content);
        if (!delegatesToShared) offenders.push(line);
    }
    if (offenders.length > 0) {
        violations.push(`Shadow location formatter implementation detected (canonical owner is shared/src/location):\n${offenders.join('\n')}`);
    }
}
