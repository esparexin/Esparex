#!/usr/bin/env node

/**
 * Schema Migration Governance Check (Cross-Platform)
 * Ensures model changes are accompanied by migrations or changelog updates.
 */

const { execSync } = require('child_process');

// DECISION-GATE C-16: SKIP_MIGRATION_GATE is a local escape hatch only. In CI
// the gate must actually run — a set SKIP_MIGRATION_GATE fails the build.
if (process.env.SKIP_MIGRATION_GATE) {
    if (process.env.CI === 'true') {
        console.error("[governance] ❌ SKIP_MIGRATION_GATE is set in CI — the schema migration gate cannot be skipped in CI (DECISION-GATE C-16). Unset it.");
        process.exit(1);
    }
    console.log("[governance] SKIP_MIGRATION_GATE is set; skipping schema migration guard (local only).");
    process.exit(0);
}

function runGit(cmd) {
    try {
        return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    } catch {
        return '';
    }
}

// Parse args
let baseRef = '';
process.argv.forEach(val => {
    if (val.startsWith('--base=')) {
        baseRef = val.split('=')[1];
    }
});

function resolveBaseRef() {
    if (baseRef) return baseRef;

    const upstream = runGit('git rev-parse --abbrev-ref --symbolic-full-name @{upstream}');
    if (upstream) return upstream;

    const develop = runGit('git show-ref --verify --quiet refs/remotes/origin/develop');
    if (develop) return 'origin/develop';

    const main = runGit('git show-ref --verify --quiet refs/remotes/origin/main');
    if (main) return 'origin/main';

    return '';
}

let targetBaseRef = resolveBaseRef();
if (targetBaseRef && !runGit(`git rev-parse --verify --quiet ${targetBaseRef}`)) {
    console.log(`[governance] Base ref '${targetBaseRef}' was not found locally; falling back to HEAD~1.`);
    targetBaseRef = '';
}

let changedFilesRaw = '';
if (targetBaseRef) {
    console.log(`[governance] Schema migration gate diff base: ${targetBaseRef}`);
    changedFilesRaw = runGit(`git diff --name-only ${targetBaseRef}...HEAD`);
} else {
    console.log('[governance] Schema migration gate diff base: HEAD~1');
    changedFilesRaw = runGit('git diff --name-only HEAD~1..HEAD');
}

const untrackedFilesRaw = runGit('git ls-files --others --exclude-standard');

// Combine and normalize files list
const allFiles = Array.from(new Set([
    ...changedFilesRaw.split('\n'),
    ...untrackedFilesRaw.split('\n')
]))
    .map(f => f.trim().replace(/\\/g, '/'))
    .filter(f => f.length > 0);

if (allFiles.length === 0) {
    console.log("[governance] No changed files detected for schema migration gate.");
    process.exit(0);
}

// Schema and model file pattern matches
const schemaPatterns = [
    /^core\/src\/models\/.*\.(ts|js)$/,
    /^shared\/src\/schemas\/.*\.(ts|js)$/,
    /^shared\/src\/types\/catalogHierarchy\.ts$/,
    /^shared\/src\/enums\/taxonomyApprovalStatus\.ts$/,
    /^core\/src\/constants\/enums\/taxonomyApprovalStatus\.ts$/
];

const schemaChanges = allFiles.filter(file => 
    schemaPatterns.some(pattern => pattern.test(file))
);

if (schemaChanges.length === 0) {
    console.log("[governance] No core model changes detected; migration gate passed.");
    process.exit(0);
}

// Migration evidence pattern matches
const migrationPatterns = [
    /^backend\/user\/migrations\//
];

const hasMigrationEvidence = allFiles.some(file =>
    migrationPatterns.some(pattern => pattern.test(file))
);

if (hasMigrationEvidence) {
    console.log("[governance] Schema change detected with migration evidence.");
    process.exit(0);
}

console.error("❌ Schema migration governance violation.");
console.error("Changed schema/model files:");
schemaChanges.forEach(file => console.error(`  - ${file}`));
console.error("\nRequired with core model changes:");
console.error("  - Add/update a migration under backend/api/migrations/");
process.exit(1);
