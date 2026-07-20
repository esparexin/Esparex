#!/usr/bin/env node
/**
 * index.ts
 * --------
 * Master CLI orchestrator for the Esparex Architecture Platform.
 *
 * Pipeline:
 *   Verify → Registry → Metrics → Reports → Console Summary
 *
 * Usage:
 *   npm run architecture              # Full scan
 *   npm run architecture -- --changed # Incremental (AST checks only scan changed files)
 *
 * All generated artifacts are written under .tooling/ (git-ignored).
 */

import { runVerification } from './verify-architecture';
import { buildRegistry } from './registry';
import { collectMetrics, appendHistory, loadHistory } from './metrics';
import { buildReport, writeReports } from './report';

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const isChanged = args.includes('--changed');

    const startMs = Date.now();

    console.log('\n🏗  Esparex Architecture Platform\n');
    if (isChanged) {
        console.log('   Mode: incremental (--changed)\n');
    }

    // 1. Verify — runs all check plugins, computes score
    process.stdout.write('   ① Verification … ');
    const { checkResults, score, summary, rules, domains, context } =
        await runVerification({ changed: isChanged, silent: true });
    console.log(`done  (score: ${score})`);

    // 2. Registry — scan manifests and count domain components
    process.stdout.write('   ② Registry … ');
    const registry = buildRegistry(domains, context.adaptersPath);
    console.log(`done  (${Object.keys(registry).length} domain(s))`);

    // 3. Metrics — compute extensible Metric[] array
    process.stdout.write('   ③ Metrics … ');
    const history = loadHistory();
    const metrics = collectMetrics(checkResults, registry, domains, history);
    console.log('done');

    // 4. Reports — build JSON/HTML and append history
    process.stdout.write('   ④ Reports … ');
    const report = buildReport(checkResults, metrics, registry, score, summary);
    writeReports(report, history);
    const updatedHistory = appendHistory(
        score,
        summary.totalViolations,
        domains.length,
        report.repositoryCommit
    );
    console.log('done');

    // 5. Console scorecard (printed after pipeline summary)
    const elapsedMs = Date.now() - startMs;
    console.log(`\n   Completed in ${(elapsedMs / 1000).toFixed(1)}s\n`);

    // Re-use the verify module's scorecard printer by importing it
    const { computeScore, buildSummary } = await import('./verify-architecture');

    // Scorecard
    const LINE = '─'.repeat(60);
    const C = {
        reset: '\x1b[0m',
        bold: '\x1b[1m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        cyan: '\x1b[36m',
        gray: '\x1b[90m',
    };
    const col = score >= 90 ? C.green : score >= 70 ? C.yellow : C.red;

    console.log(`${C.bold}${LINE}${C.reset}`);
    console.log(`  Architecture Score: ${col}${C.bold}${score} / 100${C.reset}  ${score >= 90 ? `${C.green}PASS${C.reset}` : `${C.red}FAIL${C.reset}`}`);
    console.log(`  Critical: ${summary.critical}  High: ${summary.high}  Medium: ${summary.medium}  Low: ${summary.low}`);
    console.log('');

    // Check results
    for (const r of checkResults) {
        const icon = r.passed ? `${C.green}✓${C.reset}` : `${C.red}✗${C.reset}`;
        const count = r.passed ? '' : `  ${C.gray}(${r.violations.length})${C.reset}`;
        console.log(`  ${icon}  ${r.name}${count}`);
    }

    // Top 5 issues
    const allViolations = checkResults
        .flatMap((r) => r.violations)
        .sort((a, b) => {
            const order = { critical: 0, high: 1, medium: 2, low: 3 };
            return order[a.severity] - order[b.severity];
        });

    if (allViolations.length > 0) {
        console.log(`\n  ${C.bold}Recommended Fixes:${C.reset}`);
        const icons = ['①', '②', '③', '④', '⑤'];
        allViolations.slice(0, 5).forEach((v, i) => {
            console.log(`  ${icons[i]}  ${v.message}`);
        });
    }

    // Metrics summary
    const domainMetric = metrics.find((m) => m.id === 'total_domains');
    const migratedMetric = metrics.find((m) => m.id === 'migrated_domains');
    const legacyMetric = metrics.find((m) => m.id === 'legacy_services');
    if (domainMetric || migratedMetric || legacyMetric) {
        console.log('');
        console.log(`  Domains: ${domainMetric?.value ?? '?'}  |  Migrated: ${migratedMetric?.value ?? '?'}  |  Legacy services: ${legacyMetric?.value ?? '?'}`);
    }

    // Trend
    if (updatedHistory.length >= 2) {
        const prev = updatedHistory[updatedHistory.length - 2];
        const curr = updatedHistory[updatedHistory.length - 1];
        const delta = curr.score - prev.score;
        const deltaStr = delta >= 0 ? `${C.green}+${delta}${C.reset}` : `${C.red}${delta}${C.reset}`;
        console.log(`  Trend: ${prev.score} → ${curr.score}  (${deltaStr} since ${prev.date})`);
    }

    console.log('');
    console.log(`  Reports: ${C.cyan}.tooling/reports/architecture-report.html${C.reset}`);
    console.log(`  Machine-readable: ${C.cyan}.tooling/check-summary.json${C.reset}`);
    console.log(`${C.bold}${LINE}${C.reset}\n`);

    // Exit with non-zero if failing
    process.exit(score >= 90 ? 0 : 1);
}

main().catch((err) => {
    console.error('\n❌  Architecture platform failed:', err);
    process.exit(2);
});
