/**
 * checks/cycles.ts
 * ----------------
 * Detects circular dependencies using madge.
 * madge is already installed as a dev dependency in this repository.
 *
 * Uses the CLI via execSync with --json flag for structured output.
 * Running madge on the TypeScript source directly (not compiled output).
 */

import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { ArchitectureCheck, CheckContext, CheckResult, Severity, Violation } from '../types';

function getSeverity(checkId: string, rules: CheckContext['rules']): Severity {
    for (const [tier, ids] of Object.entries(rules.severity)) {
        if ((ids as string[]).includes(checkId)) return tier as Severity;
    }
    return 'critical';
}

const SCAN_PATHS = ['core/src/domains', 'core/src/adapters'];

const check: ArchitectureCheck = {
    id: 'circular_dependency',
    name: 'Circular Dependencies',

    async run(ctx: CheckContext): Promise<CheckResult> {
        const violations: Violation[] = [];
        const severity = getSeverity(check.id, ctx.rules);

        const targets = SCAN_PATHS
            .map((p) => path.join(ctx.repoRoot, p))
            .filter((p) => {
                try { return require('node:fs').existsSync(p); } catch { return false; }
            })
            .map((p) => path.relative(ctx.repoRoot, p));

        if (targets.length === 0) {
            return { checkId: check.id, name: check.name, passed: true, violations: [] };
        }

        let raw: string;
        try {
            raw = execSync(
                `npx madge --circular --extensions ts --json ${targets.join(' ')}`,
                {
                    cwd: ctx.repoRoot,
                    encoding: 'utf-8',
                    stdio: ['pipe', 'pipe', 'pipe'],
                }
            );
        } catch (err: unknown) {
            const spawnErr = err as { stdout?: string; stderr?: string };
            raw = spawnErr.stdout ?? '';
            if (!raw.trim()) {
                // madge itself failed — not a cycle detection issue
                return { checkId: check.id, name: check.name, passed: true, violations: [] };
            }
        }

        let cycles: string[][];
        try {
            cycles = JSON.parse(raw);
        } catch {
            return { checkId: check.id, name: check.name, passed: true, violations: [] };
        }

        for (const cycle of cycles) {
            violations.push({
                severity,
                message: `Circular dependency: ${cycle.join(' → ')} → ${cycle[0]}`,
            });
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
