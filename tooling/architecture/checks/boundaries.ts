/**
 * checks/boundaries.ts
 * --------------------
 * Runs dependency-cruiser with the repository's existing .dependency-cruiser.js
 * config and reports any rule violations as architecture boundary violations.
 *
 * Uses execSync with --output-type json for reliable structured output.
 * dependency-cruiser is already installed and configured in this repository.
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

interface DepCruiseViolation {
    rule: { name: string; severity: string };
    from: { source: string };
    to: { source: string };
}

interface DepCruiseOutput {
    summary: {
        violations: DepCruiseViolation[];
        error: number;
        warn: number;
        info: number;
    };
}

const SCAN_TARGETS = ['core', 'backend/api'];

const check: ArchitectureCheck = {
    id: 'boundary_violation',
    name: 'Dependency Boundaries',

    async run(ctx: CheckContext): Promise<CheckResult> {
        const violations: Violation[] = [];
        const severity = getSeverity(check.id, ctx.rules);

        // Only run targets that exist
        const targets = SCAN_TARGETS.filter((t) => {
            const p = path.join(ctx.repoRoot, t);
            try {
                const fs = require('node:fs');
                return fs.existsSync(p);
            } catch {
                return false;
            }
        });

        if (targets.length === 0) {
            return { checkId: check.id, name: check.name, passed: true, violations: [] };
        }

        let raw: string;
        try {
            raw = execSync(
                `npx depcruise --config .dependency-cruiser.js --output-type json ${targets.join(' ')}`,
                {
                    cwd: ctx.repoRoot,
                    encoding: 'utf-8',
                    // depcruise exits 1 when violations found — capture stdout anyway
                    stdio: ['pipe', 'pipe', 'pipe'],
                }
            );
        } catch (err: unknown) {
            // depcruise exits non-zero when there are violations; stdout still has JSON
            const spawnErr = err as { stdout?: string; stderr?: string };
            raw = spawnErr.stdout ?? '';
            if (!raw.trim()) {
                violations.push({
                    severity,
                    message: `dependency-cruiser failed to run: ${spawnErr.stderr ?? String(err)}`,
                });
                return { checkId: check.id, name: check.name, passed: false, violations };
            }
        }

        let parsed: DepCruiseOutput;
        try {
            parsed = JSON.parse(raw);
        } catch {
            return { checkId: check.id, name: check.name, passed: true, violations: [] };
        }

        for (const v of parsed.summary?.violations ?? []) {
            violations.push({
                severity: v.rule.severity === 'error' ? severity : 'medium',
                file: v.from.source,
                message: `[${v.rule.name}] ${v.from.source} → ${v.to.source}`,
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
