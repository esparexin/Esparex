/**
 * checks/manifest.ts
 * ------------------
 * Validates that every domain has a manifest.yaml that passes the JSON Schema.
 * Uses the declarative AJV validator from lib/manifest.ts — no manual field checks.
 */

import { ArchitectureCheck, CheckContext, CheckResult, Severity, Violation } from '../types';
import { loadDomainManifest } from '../lib/manifest';

function getSeverity(checkId: string, rules: CheckContext['rules']): Severity {
    for (const [tier, ids] of Object.entries(rules.severity)) {
        if ((ids as string[]).includes(checkId)) return tier as Severity;
    }
    return 'medium';
}

const check: ArchitectureCheck = {
    id: 'missing_manifest',
    name: 'Manifest Validation',

    async run(ctx: CheckContext): Promise<CheckResult> {
        const violations: Violation[] = [];
        const severity = getSeverity('missing_manifest', ctx.rules);
        const schemaSeverity = getSeverity('manifest_schema_error', ctx.rules);

        for (const domain of ctx.domains) {
            const result = loadDomainManifest(domain.path);
            if (!result.ok) {
                const isMissing = result.errors.some((e) => e.includes('not found'));
                violations.push(
                    ...result.errors.map((msg) => ({
                        severity: isMissing ? severity : schemaSeverity,
                        domain: domain.id,
                        message: msg,
                    }))
                );
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
