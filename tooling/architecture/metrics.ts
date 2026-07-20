/**
 * metrics.ts
 * ----------
 * Computes the architecture Metric[] array from check results, the domain registry,
 * and direct filesystem inspection. Does NOT calculate; it just reads and counts.
 *
 * report.ts is responsible for rendering. metrics.ts only produces data.
 * All counts come from live inspection — never from hardcoded values.
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import { CheckResult, DomainInfo, HistoryEntry, Metric, Registry, Severity } from './types';
import { walkTypeScriptFiles, ensureDir, writeFile, readFile } from './lib/filesystem';
import { REPO_ROOT, TOOLING_DIR } from './lib/constants';

// ---------------------------------------------------------------------------
// Filesystem counters
// ---------------------------------------------------------------------------

/** Count TypeScript files in the legacy flat services directory. */
function countLegacyServices(): number {
    const legacyDir = path.join(REPO_ROOT, 'core', 'src', 'services');
    if (!fs.existsSync(legacyDir)) return 0;
    return walkTypeScriptFiles(legacyDir)
        .filter((f) => !/\.(spec|test)\.tsx?$/.test(f.absolutePath))
        .length;
}

/** Count TypeScript files containing bridge/compat patterns. */
function countLegacyBridges(domains: DomainInfo[]): number {
    let count = 0;
    for (const domain of domains) {
        const files = walkTypeScriptFiles(domain.path);
        for (const file of files) {
            try {
                const content = fs.readFileSync(file.absolutePath, 'utf-8');
                // Look for explicit legacy bridge markers used in the codebase
                if (content.includes('@legacy-bridge') || content.includes('LegacyBridge')) {
                    count++;
                }
            } catch {
                // Skip unreadable files
            }
        }
    }
    return count;
}

// ---------------------------------------------------------------------------
// Trend computation
// ---------------------------------------------------------------------------

function computeTrend(
    currentValue: number,
    history: HistoryEntry[],
    field: keyof HistoryEntry
): Metric['trend'] {
    if (history.length < 2) return 'stable';
    const previous = Number(history[history.length - 2][field]);
    if (isNaN(previous)) return 'stable';
    if (currentValue > previous) return 'up';
    if (currentValue < previous) return 'down';
    return 'stable';
}

// ---------------------------------------------------------------------------
// Violation counters from check results
// ---------------------------------------------------------------------------

function countViolationsOfType(
    checkResults: CheckResult[],
    checkIds: string[]
): number {
    return checkResults
        .filter((r) => checkIds.includes(r.checkId))
        .reduce((acc, r) => acc + r.violations.length, 0);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function collectMetrics(
    checkResults: CheckResult[],
    registry: Registry,
    domains: DomainInfo[],
    history: HistoryEntry[]
): Metric[] {
    const domainIds = Object.keys(registry);
    const totalDomains = domainIds.length;
    const migratedDomains = domains.filter((d) => d.hasManifest).length;
    const legacyServices = countLegacyServices();
    const legacyBridges = countLegacyBridges(domains);

    const totalPorts = domainIds.reduce((acc, id) => acc + registry[id].ports, 0);
    const totalAdapters = domainIds.reduce((acc, id) => acc + registry[id].adapters, 0);
    const avgPorts = totalDomains > 0 ? +(totalPorts / totalDomains).toFixed(1) : 0;
    const avgAdapters = totalDomains > 0 ? +(totalAdapters / totalDomains).toFixed(1) : 0;

    const boundaryViolations = countViolationsOfType(checkResults, ['boundary_violation']);
    const circularDeps = countViolationsOfType(checkResults, ['circular_dependency']);
    const deepImports = countViolationsOfType(checkResults, ['deep_import_violation']);
    const missingManifests = checkResults
        .find((r) => r.checkId === 'missing_manifest')
        ?.violations.length ?? 0;

    function sev(value: number, thresholds: [number, Severity][]): Severity {
        for (const [threshold, severity] of thresholds) {
            if (value >= threshold) return severity;
        }
        return 'low';
    }

    const metrics: Metric[] = [
        {
            id: 'total_domains',
            name: 'Total Domains',
            value: totalDomains,
            severity: 'info' as unknown as Severity,
            trend: computeTrend(totalDomains, history, 'domains'),
        },
        {
            id: 'migrated_domains',
            name: 'Migrated Domains',
            value: `${migratedDomains} / ${totalDomains}`,
            severity: migratedDomains === totalDomains ? 'low' : 'medium',
        },
        {
            id: 'legacy_services',
            name: 'Legacy Services Remaining',
            value: legacyServices,
            severity: sev(legacyServices, [[50, 'high'], [20, 'medium'], [1, 'low']]),
        },
        {
            id: 'legacy_bridges',
            name: 'Legacy Compatibility Bridges',
            value: legacyBridges,
            severity: legacyBridges > 0 ? 'medium' : 'low',
        },
        {
            id: 'boundary_violations',
            name: 'Dependency Boundary Violations',
            value: boundaryViolations,
            severity: sev(boundaryViolations, [[1, 'critical']]),
            trend: computeTrend(boundaryViolations, history, 'violations'),
        },
        {
            id: 'circular_deps',
            name: 'Circular Dependencies',
            value: circularDeps,
            severity: circularDeps > 0 ? 'critical' : 'low',
        },
        {
            id: 'deep_imports',
            name: 'Deep Import Violations',
            value: deepImports,
            severity: sev(deepImports, [[5, 'high'], [1, 'medium']]),
        },
        {
            id: 'missing_manifests',
            name: 'Missing Manifests',
            value: missingManifests,
            severity: missingManifests > 0 ? 'high' : 'low',
        },
        {
            id: 'avg_ports_per_domain',
            name: 'Avg Ports per Domain',
            value: avgPorts,
            severity: avgPorts === 0 ? 'medium' : 'low',
        },
        {
            id: 'avg_adapters_per_domain',
            name: 'Avg Adapters per Domain',
            value: avgAdapters,
            severity: avgAdapters === 0 ? 'medium' : 'low',
        },
    ];

    return metrics;
}

// ---------------------------------------------------------------------------
// History management
// ---------------------------------------------------------------------------

export function loadHistory(): HistoryEntry[] {
    const histPath = path.join(TOOLING_DIR, 'history.json');
    const raw = readFile(histPath);
    if (!raw) return [];
    try {
        return JSON.parse(raw) as HistoryEntry[];
    } catch {
        return [];
    }
}

export function appendHistory(
    score: number,
    totalViolations: number,
    domains: number,
    commit: string
): HistoryEntry[] {
    const history = loadHistory();
    const today = new Date().toISOString().split('T')[0];

    // Replace today's entry if it already exists (idempotent re-runs)
    const filtered = history.filter((h) => h.date !== today);
    const entry: HistoryEntry = { date: today, commit, score, violations: totalViolations, domains };
    const updated = [...filtered, entry].slice(-90); // keep 90 days

    ensureDir(TOOLING_DIR);
    writeFile(path.join(TOOLING_DIR, 'history.json'), JSON.stringify(updated, null, 2));
    return updated;
}
