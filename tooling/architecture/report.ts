/**
 * report.ts
 * ---------
 * Pure renderer: receives pre-computed data and writes files to .tooling/reports/.
 * Does NOT calculate or verify anything. Pure I/O.
 *
 * Outputs:
 *   .tooling/reports/architecture-report.json
 *   .tooling/reports/architecture-report.html
 */

import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { ArchitectureReport, HistoryEntry } from './types';
import { ensureDir, writeFile } from './lib/filesystem';
import { renderHtmlReport } from './lib/reporter';
import { TOOLING_DIR, REPO_ROOT } from './lib/constants';

const REPORTS_DIR = path.join(TOOLING_DIR, 'reports');
const TOOL_VERSION = '1.0.0';
const ARCH_VERSION = '1';

function getCommit(): string {
    try {
        return execSync('git rev-parse --short HEAD', {
            cwd: REPO_ROOT,
            encoding: 'utf-8',
        }).trim();
    } catch {
        return 'unknown';
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildReport(
    checkResults: ArchitectureReport['checkResults'],
    metrics: ArchitectureReport['metrics'],
    registry: ArchitectureReport['registry'],
    score: number,
    summary: ArchitectureReport['summary']
): ArchitectureReport {
    return {
        architectureVersion: ARCH_VERSION,
        toolVersion: TOOL_VERSION,
        repositoryCommit: getCommit(),
        generatedAt: new Date().toISOString(),
        score,
        passed: score >= 90,
        checkResults,
        metrics,
        registry,
        summary,
    };
}

export function writeReports(report: ArchitectureReport, history: HistoryEntry[]): void {
    ensureDir(REPORTS_DIR);

    // JSON report
    writeFile(
        path.join(REPORTS_DIR, 'architecture-report.json'),
        JSON.stringify(report, null, 2)
    );

    // HTML dashboard
    writeFile(
        path.join(REPORTS_DIR, 'architecture-report.html'),
        renderHtmlReport(report, history)
    );
}

// ---------------------------------------------------------------------------
// CLI entry point (for debugging)
// ---------------------------------------------------------------------------

if (require.main === module) {
    console.log('report.ts: run `npm run architecture` to generate the full report.');
}
