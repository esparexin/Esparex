/**
 * checks/barrels.ts
 * -----------------
 * Detects two violations:
 *   1. Domains missing a public barrel (index.ts).
 *   2. Cross-domain deep imports that bypass a domain's index.ts barrel.
 *
 * Uses the AST-based scanner (lib/scanner.ts) — no regex.
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import { ArchitectureCheck, CheckContext, CheckResult, Severity, Violation } from '../types';
import { walkTypeScriptFiles } from '../lib/filesystem';
import { scanFile, findDeepDomainImports } from '../lib/scanner';

function getSeverity(checkId: string, rules: CheckContext['rules']): Severity {
    for (const [tier, ids] of Object.entries(rules.severity)) {
        if ((ids as string[]).includes(checkId)) return tier as Severity;
    }
    return 'high';
}

const check: ArchitectureCheck = {
    id: 'deep_import_violation',
    name: 'Public Barrel Enforcement',

    async run(ctx: CheckContext): Promise<CheckResult> {
        const violations: Violation[] = [];
        const severity = getSeverity(check.id, ctx.rules);

        // 1. Check every domain has an index.ts barrel
        if (ctx.rules.barrels?.required) {
            for (const domain of ctx.domains) {
                const barrel = path.join(domain.path, 'index.ts');
                if (!fs.existsSync(barrel)) {
                    violations.push({
                        severity,
                        domain: domain.id,
                        message: `Domain "${domain.id}" is missing a public barrel (index.ts).`,
                    });
                }
            }
        }

        // 2. Scan for cross-domain deep imports
        // Walk all TypeScript files in the domains tree and check for direct
        // sub-directory imports (bypassing the barrel).
        const allFiles = walkTypeScriptFiles(ctx.domainsPath, ctx.repoRoot);
        const domainsRelPrefix = path
            .relative(ctx.repoRoot, ctx.domainsPath)
            .replace(/\\/g, '/');

        const toScan = ctx.changed
            ? allFiles.filter((f) =>
                  ctx.changed!.some((c) => f.absolutePath.endsWith(c.replace(/\//g, path.sep)))
              )
            : allFiles;

        for (const file of toScan) {
            const content = fs.readFileSync(file.absolutePath, 'utf-8');
            const scanResult = scanFile(file.absolutePath, content);
            const deepImports = findDeepDomainImports(scanResult, domainsRelPrefix);

            for (const imp of deepImports) {
                violations.push({
                    severity,
                    file: file.relativePath,
                    line: imp.line,
                    message: `Deep import bypasses barrel: "${imp.moduleSpecifier}"`,
                });
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
