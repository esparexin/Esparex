#!/usr/bin/env node
/**
 * verify-architecture.ts
 * ----------------------
 * Architecture verification orchestrator.
 *
 * Dynamically loads all check plugins from tooling/architecture/checks/,
 * runs them in parallel, computes a 100-point score using weights from
 * architecture-rules.yaml, and prints a colour-coded scorecard to stdout.
 *
 * Also writes a machine-readable exit summary to .tooling/check-summary.json
 * for CI/CD consumption.
 *
 * Usage (direct):
 *   npm run verify:architecture
 *   npm run verify:architecture -- --changed
 *
 * Or from the orchestrator (index.ts):
 *   import { runVerification } from './verify-architecture'
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import yaml from 'js-yaml';
import {
    ArchitectureCheck,
    ArchitectureRules,
    CheckContext,
    CheckResult,
    DomainInfo,
    ScoreSummary,
    Severity,
} from './types';
import { findDomains, getDomainManifestPath, pathExists, ensureDir, writeFile } from './lib/filesystem';
import { REPO_ROOT, DOMAINS_PATH, ADAPTERS_PATH, TOOLING_DIR, RULES_PATH, CHECKS_DIR } from './lib/constants';
import { execSync } from 'node:child_process';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function loadRules(): ArchitectureRules {
    const raw = fs.readFileSync(RULES_PATH, 'utf-8');
    return yaml.load(raw) as ArchitectureRules;
}

export function discoverDomains(domainsPath: string): DomainInfo[] {
    return findDomains(domainsPath).map((p) => ({
        id: path.basename(p),
        path: p,
        hasManifest: pathExists(getDomainManifestPath(p)),
    }));
}

function getChangedFiles(repoRoot: string): string[] {
    try {
        const out = execSync('git diff --name-only HEAD', {
            cwd: repoRoot,
            encoding: 'utf-8',
        });
        return out.trim().split('\n').filter(Boolean);
    } catch {
        return [];
    }
}

function getSeverityForCheck(checkId: string, rules: ArchitectureRules): Severity {
    for (const [tier, ids] of Object.entries(rules.severity)) {
        if ((ids as string[]).includes(checkId)) return tier as Severity;
    }
    return 'medium';
}

export function computeScore(results: CheckResult[], rules: ArchitectureRules): number {
    let score = 100;
    for (const result of results) {
        if (result.passed) continue;
        const tier = getSeverityForCheck(result.checkId, rules);
        const weight = rules.score_weights?.[tier] ?? 5;
        score -= result.violations.length * weight;
    }
    return Math.max(0, score);
}

export function buildSummary(results: CheckResult[], rules: ArchitectureRules): ScoreSummary {
    const counts: ScoreSummary = { critical: 0, high: 0, medium: 0, low: 0, totalViolations: 0 };
    for (const result of results) {
        for (const v of result.violations) {
            counts[v.severity]++;
            counts.totalViolations++;
        }
    }
    // Also count by check severity tier (in case violations don't carry their own severity)
    for (const result of results) {
        if (result.passed) continue;
        const tier = getSeverityForCheck(result.checkId, rules);
        // violations already counted above
        void tier;
    }
    return counts;
}

// ---------------------------------------------------------------------------
// Dynamic check loader
// ---------------------------------------------------------------------------

async function loadChecks(): Promise<ArchitectureCheck[]> {
    if (!fs.existsSync(CHECKS_DIR)) return [];

    const files = fs
        .readdirSync(CHECKS_DIR)
        .filter((f) => f.endsWith('.ts') && !f.startsWith('_'));

    const checks: ArchitectureCheck[] = [];
    for (const file of files) {
        const absPath = path.join(CHECKS_DIR, file);
        // Use pathToFileURL so Windows absolute paths (C:\...) become valid file:// URLs
        const { pathToFileURL } = require('node:url');
        const mod = await import(pathToFileURL(absPath).href);
        const check: ArchitectureCheck = mod.default;
        if (check && typeof check.run === 'function') {
            checks.push(check);
        }
    }
    return checks;
}

// ---------------------------------------------------------------------------
// Console scorecard renderer
// ---------------------------------------------------------------------------

const C = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    white: '\x1b[97m',
};

function scoreColor(score: number): string {
    if (score >= 90) return C.green;
    if (score >= 70) return C.yellow;
    return C.red;
}

function printScorecard(results: CheckResult[], score: number, rules: ArchitectureRules): void {
    const summary = buildSummary(results, rules);
    const passed = score >= 90;
    const LINE = '─'.repeat(60);

    console.log(`\n${C.bold}${LINE}${C.reset}`);
    console.log(`${C.bold}  Esparex Architecture Platform${C.reset}`);
    console.log(`${LINE}`);

    const scoreStr = `${scoreColor(score)}${C.bold}${score} / 100${C.reset}`;
    const passStr = passed
        ? `${C.green}${C.bold}  PASS${C.reset}`
        : `${C.red}${C.bold}  FAIL${C.reset}`;
    console.log(`\n  Architecture Score: ${scoreStr}${passStr}\n`);

    // Severity summary
    const sevLines = [
        ['critical', '❌', summary.critical, C.red],
        ['high', '⚠ ', summary.high, C.yellow],
        ['medium', 'ℹ ', summary.medium, C.cyan],
        ['low', '· ', summary.low, C.gray],
    ] as const;
    for (const [, icon, count, color] of sevLines) {
        console.log(`  ${color}${icon}  ${count}${C.reset}`);
    }

    // Per-check results
    console.log('');
    for (const result of results) {
        const icon = result.passed ? `${C.green}✓${C.reset}` : `${C.red}✗${C.reset}`;
        const detail = result.passed ? '' : `  ${C.gray}(${result.violations.length} violation${result.violations.length !== 1 ? 's' : ''})${C.reset}`;
        console.log(`  ${icon}  ${result.name}${detail}`);
        if (!result.passed) {
            const maxShown = 3;
            for (const v of result.violations.slice(0, maxShown)) {
                const loc = v.file ? ` ${C.gray}${v.file}${v.line ? ':' + v.line : ''}${C.reset}` : '';
                console.log(`       ${C.gray}→${C.reset}${loc} ${v.message}`);
            }
            if (result.violations.length > maxShown) {
                console.log(`       ${C.gray}  … and ${result.violations.length - maxShown} more${C.reset}`);
            }
        }
    }

    // Top fixes
    const allViolations = results.flatMap((r) => r.violations);
    const topIssues = allViolations
        .sort((a, b) => {
            const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
            return order[a.severity] - order[b.severity];
        })
        .slice(0, 5);

    if (topIssues.length > 0) {
        console.log(`\n  ${C.bold}Top Issues:${C.reset}`);
        topIssues.forEach((v, i) => {
            const num = ['①', '②', '③', '④', '⑤'][i];
            console.log(`  ${num}  ${v.message}`);
        });
    }

    console.log(`\n${LINE}${C.reset}\n`);
}

// ---------------------------------------------------------------------------
// Exit code summary (machine-readable for CI)
// ---------------------------------------------------------------------------

function writeExitSummary(score: number, summary: ScoreSummary): void {
    ensureDir(TOOLING_DIR);
    const out = {
        passed: score >= 90,
        score,
        critical: summary.critical,
        high: summary.high,
        medium: summary.medium,
        low: summary.low,
    };
    writeFile(path.join(TOOLING_DIR, 'check-summary.json'), JSON.stringify(out, null, 2));
}

// ---------------------------------------------------------------------------
// Public API (used by index.ts orchestrator)
// ---------------------------------------------------------------------------

export interface VerificationResult {
    checkResults: CheckResult[];
    score: number;
    summary: ScoreSummary;
    rules: ArchitectureRules;
    domains: DomainInfo[];
    context: CheckContext;
}

export async function runVerification(opts: {
    changed?: boolean;
    silent?: boolean;
} = {}): Promise<VerificationResult> {
    const rules = loadRules();
    const domains = discoverDomains(DOMAINS_PATH);
    const changed = opts.changed ? getChangedFiles(REPO_ROOT) : undefined;

    const context: CheckContext = {
        repoRoot: REPO_ROOT,
        domainsPath: DOMAINS_PATH,
        adaptersPath: ADAPTERS_PATH,
        rules,
        domains,
        changed,
    };

    const checks = await loadChecks();
    const checkResults = await Promise.all(checks.map((c) => c.run(context)));

    const score = computeScore(checkResults, rules);
    const summary = buildSummary(checkResults, rules);

    writeExitSummary(score, summary);

    if (!opts.silent) {
        printScorecard(checkResults, score, rules);
    }

    return { checkResults, score, summary, rules, domains, context };
}

// ---------------------------------------------------------------------------
// Entry point (when run directly)
// ---------------------------------------------------------------------------

if (require.main === module) {
    const args = process.argv.slice(2);
    const isChanged = args.includes('--changed');

    runVerification({ changed: isChanged })
        .then(({ score }) => {
            process.exit(score >= 90 ? 0 : 1);
        })
        .catch((err) => {
            console.error('Architecture verification failed:', err);
            process.exit(2);
        });
}
