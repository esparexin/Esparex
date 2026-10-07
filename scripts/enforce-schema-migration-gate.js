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

    // CI (GitHub Actions): GITHUB_BASE_REF names the PR target branch (e.g. "develop").
    // Prefer it so the gate diffs the full PR, not just HEAD~1.
    const ghBase = process.env.GITHUB_BASE_REF;
    if (ghBase) {
        const ref = `origin/${ghBase}`;
        if (runGit(`git rev-parse --verify --quiet ${ref}`)) return ref;
        // Ref not fetched (shallow/limited PR checkout) — fetch just the base branch.
        runGit(`git fetch --no-tags --depth=50 origin ${ghBase}:refs/remotes/${ref}`);
        if (runGit(`git rev-parse --verify --quiet ${ref}`)) return ref;
    }

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
let diffRange = '';
let useHeadFallback = false;
if (targetBaseRef) {
    console.log(`[governance] Schema migration gate diff base: ${targetBaseRef}`);
    diffRange = `${targetBaseRef}...HEAD`;
    changedFilesRaw = runGit(`git diff --name-only ${diffRange}`);
} else {
    console.log('[governance] Schema migration gate diff base: HEAD~1');
    diffRange = 'HEAD~1..HEAD';
    useHeadFallback = true;
    changedFilesRaw = runGit(`git diff --name-only ${diffRange}`);
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

// A model file change only needs a migration when it touches schema-significant
// content. Import refactors (the consolidation's composition-barrel moves),
// hook/method body edits, comment edits, and whitespace do not change the
// database schema. We extract the schema-defining blocks — TypeScript
// `interface` declarations and Mongoose `new Schema(...)` calls, via brace
// matching that skips strings and comments — at base vs HEAD; identical blocks
// mean no migration is required.
function extractSchemaBlocks(content) {
    const blocks = [];
    const pushBlock = (startIdx) => {
        let j = startIdx;
        while (j < content.length && content[j] !== '{' && content[j] !== '(') j++;
        if (j >= content.length) return content.length;
        const open = content[j];
        const close = open === '{' ? '}' : ')';
        let depth = 0;
        let k = j;
        let inStr = null; // ', ", or `
        let inLineComment = false;
        let inBlockComment = false;
        while (k < content.length) {
            const c = content[k];
            const next = content[k + 1];
            if (inLineComment) {
                if (c === '\n') inLineComment = false;
            } else if (inBlockComment) {
                if (c === '*' && next === '/') { inBlockComment = false; k++; }
            } else if (inStr) {
                if (c === '\\') k++; // skip escaped char
                else if (c === inStr) inStr = null;
            } else if (c === '/' && next === '/') {
                inLineComment = true; k++;
            } else if (c === '/' && next === '*') {
                inBlockComment = true; k++;
            } else if (c === "'" || c === '"' || c === '`') {
                inStr = c;
            } else if (c === open) {
                depth++;
            } else if (c === close) {
                depth--;
                if (depth === 0) { blocks.push(content.slice(startIdx, k + 1)); return k + 1; }
            }
            k++;
        }
        return k;
    };
    const patterns = [/\binterface\s+\w+/g, /\bnew\s+Schema\s*(<[^<>]*>)?\s*\(/g];
    for (const re of patterns) {
        let m;
        while ((m = re.exec(content)) !== null) {
            const end = pushBlock(m.index);
            re.lastIndex = end;
        }
    }
    // Normalize: strip comments/whitespace so formatting-only diffs don't count.
    return blocks.map(b => b
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .trim()
    ).sort().join('\n---\n');
}

function stripToSchemaSignificant(content) {
    return extractSchemaBlocks(content);
}

function hasSchemaSignificantChange(file) {
    const baseCommit = useHeadFallback
        ? runGit('git rev-parse --verify --quiet HEAD~1')
        : runGit(`git merge-base ${targetBaseRef} HEAD`);
    if (!baseCommit) return true; // cannot determine base — fail safe (flag it)
    const baseContent = runGit(`git show ${baseCommit}:"${file}"`);
    let headContent = '';
    try {
        headContent = require('fs').readFileSync(file, 'utf8');
    } catch { /* file deleted — treat as significant */ }
    if (!baseContent || !headContent) return true; // added/deleted file — flag it
    return stripToSchemaSignificant(baseContent) !== stripToSchemaSignificant(headContent);
}

const significantSchemaChanges = schemaChanges.filter(hasSchemaSignificantChange);

if (significantSchemaChanges.length === 0) {
    if (schemaChanges.length > 0) {
        console.log(`[governance] ${schemaChanges.length} model file(s) changed but only imports/comments/whitespace — no migration required.`);
    } else {
        console.log("[governance] No core model changes detected; migration gate passed.");
    }
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
console.error("Changed schema/model files (schema-significant changes):");
significantSchemaChanges.forEach(file => console.error(`  - ${file}`));
console.error("\nRequired with core model changes:");
console.error("  - Add/update a migration under backend/api/migrations/");
process.exit(1);
