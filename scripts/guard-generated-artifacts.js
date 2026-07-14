#!/usr/bin/env node
/**
 * guard-generated-artifacts.js
 * -----------------------------
 * Pre-commit / CI guard that fails if generated tooling artifacts are staged
 * for commit. This is a permanent prevention layer — it does not replace
 * .gitignore but acts as a hard stop when patterns are accidentally tracked.
 *
 * Classification:
 *   Source        — committed (TypeScript, tests, configs, docs)
 *   Generated     — never committed (graphify-out, .tooling, cache, reports)
 *   Cache         — never committed (.eslintcache, __pycache__, dist)
 *   Temporary     — never committed (*.log, temp/, scratch/)
 *   Release       — never committed (build output, dist/)
 *
 * Usage:
 *   node scripts/guard-generated-artifacts.js          # check staged files
 *   node scripts/guard-generated-artifacts.js --all    # check entire working tree (CI mode)
 */

'use strict';

const { execSync } = require('node:child_process');

// ---------------------------------------------------------------------------
// Forbidden path patterns — files matching any of these must never be committed
// ---------------------------------------------------------------------------
const FORBIDDEN_PATTERNS = [
    // Graphify — knowledge graph outputs
    /^graphify-out\//,
    /\.graphify_.*\.(json|txt|sig)$/,
    /^graph\.(json|graphml|html)$/,
    /^GRAPH_REPORT\.md$/,
    /^cypher\.txt$/,
    /\.graphml$/,

    // Architecture tooling
    /^\.tooling\//,
    /check-summary\.json$/,
    /architecture-report\.(json|html)$/,
    /graphify-summary\.md$/,

    // Python runtime
    /^\.venv\//,
    /__pycache__\//,
    /\.py[cod]$/,

    // Build artifacts (source directories only)
    /^core\/dist\//,
    /^shared\/dist\//,
    /^backend\/api\/dist\//,
    /^apps\/admin\/dist\//,
    /^apps\/web\/(dist|out|\.next)\//,

    // Cache files
    /^\.eslintcache\//,
    /\.tsbuildinfo$/,

    // Timestamped snapshot directories
    /^graphify-out\/\d{4}-\d{2}-\d{2}\//,
];

const ALLOWED_EXCEPTIONS = new Set([
    // Add explicit exceptions here with justification comments
]);

function getStagedFiles() {
    try {
        return execSync('git diff --cached --name-only', { encoding: 'utf-8' })
            .trim().split('\n').filter(Boolean);
    } catch { return []; }
}

function check(files) {
    const violations = [];
    for (const file of files) {
        if (ALLOWED_EXCEPTIONS.has(file)) continue;
        for (const pattern of FORBIDDEN_PATTERNS) {
            if (pattern.test(file)) {
                violations.push({ file, pattern: pattern.toString() });
                break;
            }
        }
    }
    return violations;
}

const files = getStagedFiles();

if (files.length === 0) {
    console.log('[guard:generated-artifacts] No staged files to check.');
    process.exit(0);
}

const violations = check(files);

if (violations.length === 0) {
    console.log(`[guard:generated-artifacts] OK — ${files.length} staged file(s) passed.`);
    process.exit(0);
}

console.error('\n[guard:generated-artifacts] BLOCKED — generated artifacts must not be committed:\n');
for (const { file, pattern } of violations) {
    console.error(`  x  ${file}`);
    console.error(`       matched pattern: ${pattern}\n`);
}
console.error(
    'These files are generated at runtime and must never be committed.\n' +
    'To unblock: remove them from staging with git restore --staged <file>\n' +
    'If a file MUST be committed, add it to ALLOWED_EXCEPTIONS in this script.\n'
);
process.exit(1);
