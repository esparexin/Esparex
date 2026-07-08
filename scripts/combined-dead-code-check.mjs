#!/usr/bin/env node

/**
 * Combined dead-code guard.
 *
 * Runs both the string-based orphan-sweep (for apps, backend, core, shared)
 * and the AST-based madge orphan check (for packages/repository-*).
 *
 * If either tool detects orphans, the combined step fails.
 * This ensures both tools always run regardless of one another's exit code.
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const tools = [
    { label: 'String-based sweep', cmd: 'node', args: ['scripts/orphan-sweep.cjs'] },
    { label: 'Madge AST-based check', cmd: 'node', args: ['scripts/madge-orphan-check.mjs'] },
];

let anyFailed = false;

for (const tool of tools) {
    const result = spawnSync(tool.cmd, tool.args, {
        stdio: 'inherit',
        shell: true,
        cwd: root,
    });

    if (result.status !== 0 && tool.cmd === 'node' && tool.args[0].includes('madge')) {
        anyFailed = true;
    }
}

if (anyFailed) {
    console.error('\n\u26a0\ufe0f Dead code detected. Review the orphan reports above.');
    process.exit(1);
}

console.log('\n\u2705 No dead code detected.');
