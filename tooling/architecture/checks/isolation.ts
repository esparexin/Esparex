/**
 * checks/isolation.ts
 * -------------------
 * Detects forbidden infrastructure imports inside domain/ and ports/ directories.
 *
 * Uses the AST-based scanner (lib/scanner.ts) — no regex.
 * Forbidden modules are loaded from architecture-rules.yaml (forbidden_in_domain).
 *
 * Only value imports are checked; `import type` is permitted anywhere.
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import { ArchitectureCheck, CheckContext, CheckResult, Severity, Violation } from '../types';
import { walkTypeScriptFiles } from '../lib/filesystem';
import { scanFile, findForbiddenImports } from '../lib/scanner';

function getSeverity(checkId: string, rules: CheckContext['rules']): Severity {
    for (const [tier, ids] of Object.entries(rules.severity)) {
        if ((ids as string[]).includes(checkId)) return tier as Severity;
    }
    return 'critical';
}

/** Protected subdirectories — infrastructure imports are forbidden here. */
const PROTECTED_LAYERS = ['domain', 'ports'];

const check: ArchitectureCheck = {
    id: 'boundary_violation',
    name: 'Domain Isolation',

    async run(ctx: CheckContext): Promise<CheckResult> {
        const violations: Violation[] = [];
        const severity = getSeverity(check.id, ctx.rules);
        const banned = ctx.rules.forbidden_in_domain ?? [];

        for (const domain of ctx.domains) {
            for (const layer of PROTECTED_LAYERS) {
                const layerPath = path.join(domain.path, layer);
                if (!fs.existsSync(layerPath)) continue;

                const files = walkTypeScriptFiles(layerPath);
                // If --changed, only scan files that appear in the changed list
                const toScan = ctx.changed
                    ? files.filter((f) =>
                          ctx.changed!.some((c) => f.absolutePath.endsWith(c.replace(/\//g, path.sep)))
                      )
                    : files;

                for (const file of toScan) {
                    const content = fs.readFileSync(file.absolutePath, 'utf-8');
                    const result = scanFile(file.absolutePath, content);
                    const forbidden = findForbiddenImports(result, banned);

                    for (const imp of forbidden) {
                        violations.push({
                            severity,
                            domain: domain.id,
                            file: file.relativePath,
                            line: imp.line,
                            message: `"${imp.moduleSpecifier}" is infrastructure; forbidden in ${layer}/`,
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
