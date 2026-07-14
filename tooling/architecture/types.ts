/**
 * types.ts
 * --------
 * Shared type definitions for the entire architecture platform.
 * Imported by checks, orchestrators, metrics, registry, and reporters.
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low';

// ---------------------------------------------------------------------------
// Check system
// ---------------------------------------------------------------------------

export interface Violation {
    severity: Severity;
    domain?: string;
    file?: string;
    line?: number;
    message: string;
}

export interface CheckResult {
    checkId: string;
    name: string;
    passed: boolean;
    violations: Violation[];
}

export interface ArchitectureCheck {
    id: string;
    name: string;
    run(context: CheckContext): Promise<CheckResult>;
}

export interface DomainInfo {
    id: string;
    path: string;
    hasManifest: boolean;
}

export interface CheckContext {
    repoRoot: string;
    domainsPath: string;
    adaptersPath: string;
    rules: ArchitectureRules;
    domains: DomainInfo[];
    /** Only populated when running with --changed flag. */
    changed?: string[];
}

// ---------------------------------------------------------------------------
// Rules schema (matches architecture-rules.yaml)
// ---------------------------------------------------------------------------

export interface ArchitectureRules {
    version: number;
    ports: { suffix: string[] };
    adapters: { suffix: string[] };
    barrels: { required: boolean };
    max_domain_files: number;
    max_domain_largest: number;
    forbidden_in_domain: string[];
    /** Maps severity tier names to arrays of check ids. */
    severity: Record<string, string[]>;
    /** Maps severity tier names to score deduction per violation. */
    score_weights: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

export interface Metric {
    id: string;
    name: string;
    value: number | string;
    severity?: Severity;
    trend?: 'up' | 'down' | 'stable';
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export interface RegistryEntry {
    owner: string;
    stability: string;
    maturity: string;
    reference: boolean;
    dependencies: string[];
    dependents: string[];
    ports: number;
    adapters: number;
    entities: number;
    services: number;
    policies: number;
    events: number;
}

export type Registry = Record<string, RegistryEntry>;

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

export interface ScoreSummary {
    critical: number;
    high: number;
    medium: number;
    low: number;
    totalViolations: number;
}

export interface ArchitectureReport {
    architectureVersion: string;
    toolVersion: string;
    repositoryCommit: string;
    generatedAt: string;
    score: number;
    passed: boolean;
    checkResults: CheckResult[];
    metrics: Metric[];
    registry: Registry;
    summary: ScoreSummary;
}

export interface HistoryEntry {
    date: string;
    commit: string;
    score: number;
    violations: number;
    domains: number;
}
