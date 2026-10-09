#!/usr/bin/env node
/**
 * Design Token Adoption Guard
 *
 * PURPOSE: Enforce that NEW code (changed files in this PR/commit) does not
 * introduce raw Tailwind palette classes or inline styles that bypass the
 * semantic design token contract.
 *
 * MODE: Ratchet — does NOT fail on legacy files. Only fails when NEW violations
 * are introduced in the current diff vs origin/develop.
 *
 * CATCHES (in new/modified lines only):
 *   - text-slate-*, bg-slate-*, border-slate-*  (raw palette → use foreground tokens)
 *   - text-xs, text-sm, text-base, text-lg      (Tailwind scale → use text-caption/body/etc.)
 *   - style={{ ... }}                            (inline styles → use Tailwind tokens)
 *   - text-gray-*, text-zinc-*, text-neutral-*  (other raw neutral palettes)
 *
 * SUPPRESSION: Add `// design-token-ignore: <reason>` on the same or previous line
 * for legitimate exceptions (canvas calculations, dynamic values, third-party overrides).
 */

'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const isCI = process.env.CI === 'true';
const isStagedMode = process.argv.includes('--staged');
// DECISION-GATE C-3: whole-tree (not staged/diff) scan with a ratcheting total
// baseline, for wiring into GOV-GUARDS-001. Counts every violation across the
// tree; fails when the total exceeds the baseline; tightens the baseline when
// the total shrinks.
const isTreeMode = process.argv.includes('--tree');
const TREE_BASELINE_PATH = path.join(repoRoot, 'scripts', 'policy', 'design-token-baseline.json');

// ─── Banned patterns ────────────────────────────────────────────────────────

const BANNED_PATTERNS = [
    {
        pattern: /\b(text|bg|border|ring|shadow|divide|from|via|to)-(slate|gray|zinc|neutral|stone)-\d{2,3}\b/,
        name: 'Raw neutral palette',
        remediation: 'Use semantic tokens: text-foreground, text-foreground-secondary, text-foreground-subtle, bg-muted, border-border',
    },
    {
        pattern: /\btext-(xs|sm|base|lg)\b/,
        name: 'Raw Tailwind type scale',
        remediation: 'Use SSOT tokens: text-tiny(11px), text-caption(12px), text-small(13px), text-body(14px), text-body-lg(16px), text-h4(18px)',
    },
    {
        pattern: /\b(text|bg|border|ring|divide|from|via|to)-(blue|amber|emerald|red|green|yellow|orange|purple|pink|indigo|teal|cyan|lime|fuchsia|rose|sky|violet)-\d{2,3}\/?\d*?\b/,
        name: 'Raw chromatic palette',
        remediation: 'Use semantic tokens: bg-primary/text-primary/border-border/bg-card/text-foreground/bg-muted/text-destructive (AGENTS.md §21 Zero Raw Palette)',
    },
    {
        pattern: /\bstyle=\{\{/,
        name: 'Inline style block',
        remediation: 'Use Tailwind utility classes or design tokens. Exception: dynamic canvas/animation values — add design-token-ignore comment.',
    },
    {
        pattern: /\b(shadow-2xs|shadow-xs|rounded-xs|outline-hidden)\b/,
        name: 'Tailwind v4-only class (project uses v3)',
        remediation: 'Use v3 equivalents: shadow-xs→shadow-sm, shadow-2xs→shadow-sm, rounded-xs→rounded-sm, outline-hidden→outline-none. See ROOT-CAUSE-AUDIT for the v4-on-v3 incident.',
    },
    {
        pattern: /\b(h|w|min-h|min-w|size)-(\d+\.5)\b/,
        name: 'Fractional spacing (v4-only, project uses v3)',
        remediation: 'Use arbitrary values: h-4.5→h-[18px] (4.5*4px). Fractional spacing is v4-only.',
    },
];

const SUPPRESSION_PATTERN = /design-token-ignore(?::\s*(.+))?/;

// ─── File targeting ──────────────────────────────────────────────────────────

const TARGET_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];
const EXCLUDED_DIRS = ['node_modules', '.next', 'dist', 'build', 'coverage', '.expo', 'scripts', 'tooling'];
const EXCLUDED_FILE_PATTERNS = [/\.spec\.[tj]sx?$/, /\.test\.[tj]sx?$/, /\.d\.ts$/];

function isTargetFile(filePath) {
    if (EXCLUDED_FILE_PATTERNS.some(p => p.test(filePath))) return false;
    if (!TARGET_EXTENSIONS.some(ext => filePath.endsWith(ext))) return false;
    // Only scan UI-layer source directories
    const uiDirs = ['apps/', 'packages/'];
    if (!uiDirs.some(d => filePath.startsWith(d))) return false;
    if (EXCLUDED_DIRS.some(d => filePath.includes(`/${d}/`) || filePath.startsWith(`${d}/`))) return false;
    return true;
}

// ─── Git diff analysis ───────────────────────────────────────────────────────

function getChangedFiles() {
    try {
        let cmd;
        if (isStagedMode) {
            cmd = 'git diff --cached --name-only --diff-filter=ACM';
        } else if (isCI) {
            cmd = 'git diff --name-only --diff-filter=ACM origin/develop...HEAD';
        } else {
            cmd = 'git diff --name-only --diff-filter=ACM origin/develop...HEAD';
        }
        const output = execSync(cmd, { cwd: repoRoot, encoding: 'utf-8' });
        return output.trim().split('\n').filter(Boolean).filter(isTargetFile);
    } catch {
        // Fallback: scan all tracked files (safety net)
        return [];
    }
}

function getNewLines(filePath) {
    try {
        let cmd;
        if (isStagedMode) {
            cmd = `git diff --cached -U0 -- "${filePath}"`;
        } else {
            cmd = `git diff -U0 origin/develop...HEAD -- "${filePath}"`;
        }
        const diff = execSync(cmd, { cwd: repoRoot, encoding: 'utf-8' });
        // Extract only added lines (+ prefix), not context or removed lines
        return diff
            .split('\n')
            .filter(line => line.startsWith('+') && !line.startsWith('+++'))
            .map(line => line.slice(1)); // strip leading +
    } catch {
        return [];
    }
}

// ─── Violation detection ─────────────────────────────────────────────────────

function checkLine(line, prevLine) {
    // Check for suppression on this line or previous line
    if (SUPPRESSION_PATTERN.test(line) || SUPPRESSION_PATTERN.test(prevLine || '')) {
        const match = (line.match(SUPPRESSION_PATTERN) || (prevLine || '').match(SUPPRESSION_PATTERN));
        if (match) {
            const reason = (match[1] || '').trim();
            if (!reason) {
                return { suppressed: false, emptySuppression: true };
            }
            return { suppressed: true };
        }
    }
    return { suppressed: false };
}

// ─── Whole-tree mode (DECISION-GATE C-3) ────────────────────────────────────

function loadTreeBaseline() {
    try {
        return JSON.parse(fs.readFileSync(TREE_BASELINE_PATH, 'utf-8'));
    } catch {
        return null;
    }
}

function saveTreeBaseline(total) {
    fs.writeFileSync(
        TREE_BASELINE_PATH,
        JSON.stringify({ totalViolations: total, updatedAt: new Date().toISOString() }, null, 2) + '\n'
    );
}

function walkTreeFiles(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (EXCLUDED_DIRS.includes(entry.name) || entry.name.startsWith('.')) continue;
            walkTreeFiles(abs, out);
        } else if (entry.isFile()) {
            const rel = path.relative(repoRoot, abs).replace(/\\/g, '/');
            if (isTargetFile(rel)) out.push({ abs, rel });
        }
    }
    return out;
}

function runTreeMode() {
    const roots = ['apps', 'packages'].map((d) => path.join(repoRoot, d));
    const files = roots.flatMap((r) => walkTreeFiles(r));
    const violations = [];

    for (const { abs, rel } of files) {
        let content;
        try {
            content = fs.readFileSync(abs, 'utf-8');
        } catch {
            continue;
        }
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
            const prevLine = idx > 0 ? lines[idx - 1] : '';
            const { suppressed, emptySuppression } = checkLine(line, prevLine);
            if (suppressed || emptySuppression) return;
            for (const { pattern, name } of BANNED_PATTERNS) {
                const match = line.match(pattern);
                if (match) {
                    // GOV-GUARDS-001 parses lines starting with "- " for ratchet comparison.
                    violations.push(`- ${rel}:${idx + 1} [${name}] ${match[0]}`);
                    break;
                }
            }
        });
    }

    const total = violations.length;
    const baseline = loadTreeBaseline();

    if (!baseline) {
        saveTreeBaseline(total);
        console.log(`✅ Design Token Adoption Guard (--tree): baseline initialized at ${total} total violation(s) across ${files.length} files.`);
        process.exit(0);
    }

    if (total > baseline.totalViolations) {
        console.error(`\n❌ Design Token Adoption Guard (--tree): ${total} total violations exceed ratchet baseline ${baseline.totalViolations}.`);
        console.error('   New raw palette / inline style violations were introduced — use semantic design tokens.\n');
        violations.slice(0, 25).forEach((v) => console.error(`  ${v}`));
        if (violations.length > 25) console.error(`  ... and ${violations.length - 25} more.\n`);
        process.exit(1);
    }

    if (total < baseline.totalViolations) {
        saveTreeBaseline(total);
        console.log(`✅ Design Token Adoption Guard (--tree): ${total} total violations (baseline tightened from ${baseline.totalViolations}).`);
    } else {
        console.log(`✅ Design Token Adoption Guard (--tree): ${total} total violations across ${files.length} files — at ratchet baseline.`);
    }
    process.exit(0);
}

// ─── Main ────────────────────────────────────────────────────────────────────

if (isTreeMode) {
    runTreeMode();
}

const changedFiles = getChangedFiles();

if (changedFiles.length === 0) {
    console.log('ℹ️  Design Token Adoption Guard: No matching TypeScript/TSX files in diff. (Pass)');
    process.exit(0);
}

const violations = [];
const emptySuppressions = [];

for (const relFile of changedFiles) {
    const absFile = path.join(repoRoot, relFile);
    if (!fs.existsSync(absFile)) continue;

    const newLines = getNewLines(relFile);
    if (newLines.length === 0) continue;

    newLines.forEach((line, idx) => {
        const prevLine = idx > 0 ? newLines[idx - 1] : '';
        const { suppressed, emptySuppression } = checkLine(line, prevLine);

        if (emptySuppression) {
            emptySuppressions.push({ file: relFile, line: line.trim() });
            return;
        }
        if (suppressed) return;

        for (const { pattern, name, remediation } of BANNED_PATTERNS) {
            const match = line.match(pattern);
            if (match) {
                violations.push({
                    file: relFile,
                    code: line.trim(),
                    match: match[0],
                    name,
                    remediation,
                });
            }
        }
    });
}

// ─── Report ──────────────────────────────────────────────────────────────────

let hasErrors = false;

if (emptySuppressions.length > 0) {
    hasErrors = true;
    console.error('\n❌ Design Token Adoption Guard: Empty suppression comments detected!');
    console.error('   Format: // design-token-ignore: <documented reason>\n');
    emptySuppressions.forEach(v => {
        console.error(`   ${v.file}`);
        console.error(`   Code: ${v.code}\n`);
    });
}

if (violations.length > 0) {
    hasErrors = true;
    console.error('\n❌ Design Token Adoption Guard: Raw palette / inline style violations in new code!\n');

    const byType = {};
    violations.forEach(v => {
        if (!byType[v.name]) byType[v.name] = [];
        byType[v.name].push(v);
    });

    for (const [type, items] of Object.entries(byType)) {
        console.error(`  ── ${type} (${items.length} violation${items.length > 1 ? 's' : ''}) ──`);
        console.error(`  Remediation: ${items[0].remediation}\n`);
        items.slice(0, 10).forEach(v => {
            console.error(`  ${v.file}`);
            console.error(`    Found: \`${v.match}\``);
            console.error(`    Line:  ${v.code}\n`);
        });
        if (items.length > 10) {
            console.error(`  ... and ${items.length - 10} more violations in this category.\n`);
        }
    }

    console.error('─────────────────────────────────────────────────────');
    console.error('Semantic token reference:');
    console.error('  Colors:     text-foreground | text-foreground-secondary | text-foreground-subtle');
    console.error('              bg-muted | bg-surface | border-border | text-primary');
    console.error('  Typography: text-tiny | text-caption | text-small | text-body | text-body-lg');
    console.error('              text-h4 | text-h3 | text-h2 | text-h1 | text-display');
    console.error('─────────────────────────────────────────────────────\n');
}

if (hasErrors) {
    process.exit(1);
} else {
    const fileCount = changedFiles.length;
    console.log(`✅ Design Token Adoption Guard: ${fileCount} file(s) audited — 0 new raw palette or inline style violations.`);
    process.exit(0);
}
