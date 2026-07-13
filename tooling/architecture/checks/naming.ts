/**
 * checks/naming.ts
 * ----------------
 * Validates port and adapter file naming conventions.
 *
 * Rules are loaded from architecture-rules.yaml (ports.suffix, adapters.suffix).
 * Uses the filesystem walker — not the AST scanner (file names don't need AST).
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import { ArchitectureCheck, CheckContext, CheckResult, Severity, Violation } from '../types';
import { walkTypeScriptFiles } from '../lib/filesystem';

function getSeverity(checkId: string, rules: CheckContext['rules']): Severity {
    for (const [tier, ids] of Object.entries(rules.severity)) {
        if ((ids as string[]).includes(checkId)) return tier as Severity;
    }
    return 'medium';
}

function endsWithAny(name: string, suffixes: string[]): boolean {
    return suffixes.some((s) => name.endsWith(s));
}

const check: ArchitectureCheck = {
    id: 'naming_violation',
    name: 'Naming Conventions',

    async run(ctx: CheckContext): Promise<CheckResult> {
        const violations: Violation[] = [];
        const severity = getSeverity(check.id, ctx.rules);
        const portSuffixes = ctx.rules.ports?.suffix ?? ['Port', 'RepositoryPort'];
        const adapterSuffixes = ctx.rules.adapters?.suffix ?? ['Adapter', 'RepositoryAdapter'];

        for (const domain of ctx.domains) {
            // --- Check ports/ files ---
            const portsDir = path.join(domain.path, 'ports');
            if (fs.existsSync(portsDir)) {
                const portFiles = walkTypeScriptFiles(portsDir);
                for (const file of portFiles) {
                    const base = path.basename(file.absolutePath, '.ts');
                    if (!endsWithAny(base, portSuffixes)) {
                        violations.push({
                            severity,
                            domain: domain.id,
                            file: file.relativePath,
                            message: `Port file "${base}.ts" must end with one of: ${portSuffixes.join(', ')}`,
                        });
                    }
                }
            }

            // --- Check adapters for this domain ---
            // Adapters live outside the domain dir; e.g. core/src/adapters/outbound/<domain>/
            const domainAdaptersDir = path.join(ctx.adaptersPath, 'outbound', 'database', domain.id);
            if (fs.existsSync(domainAdaptersDir)) {
                const adapterFiles = walkTypeScriptFiles(domainAdaptersDir);
                for (const file of adapterFiles) {
                    const base = path.basename(file.absolutePath, '.ts');
                    // Skip index files and non-adapter files
                    if (base === 'index') continue;
                    if (!endsWithAny(base, adapterSuffixes)) {
                        violations.push({
                            severity,
                            domain: domain.id,
                            file: file.relativePath,
                            message: `Adapter file "${base}.ts" must end with one of: ${adapterSuffixes.join(', ')}`,
                        });
                    }
                }
            }
        }

        return {
            checkId: check.id,
            name: check.name,
            passed: violations.length === 0,
            violations,
        };
    },
};

export default check;
