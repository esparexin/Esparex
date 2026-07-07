#!/usr/bin/env node
/**
 * DEPLOY GATE (OPS-GOV-001)
 *
 * Orchestrator for all repository governance checks.
 * This must pass with exit code 0 before any PR can be merged or deployment triggered.
 */

const { spawnSync } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../');

const GOVERNANCE_SCRIPTS = [
    {
        name: 'API Contract Governance',
        command: 'node',
        args: ['scripts/verify-api-contract.js']
    },
    {
        name: 'Catalog Data Governance',
        command: 'node',
        args: ['scripts/catalog-governance-audit.js']
    },
    {
        name: 'Local Quality Gates (Lint/Types)',
        command: 'node',
        args: ['scripts/enforce-local-quality-gates.js']
    }
];

console.log('==================================================');
console.log('🚀 INITIALIZING DEPLOYMENT GOVERNANCE GATE');
console.log('==================================================\n');

let hasFailures = false;

for (const script of GOVERNANCE_SCRIPTS) {
    console.log(`[EXEC] Running ${script.name}...`);
    const startTime = Date.now();
    
    const result = spawnSync(script.command, script.args, {
        cwd: rootDir,
        stdio: 'inherit',
        shell: true
    });

    const duration = Date.now() - startTime;

    if (result.status !== 0) {
        console.error(`\n❌ [FAILED] ${script.name} (Exit code: ${result.status}) [${duration}ms]\n`);
        hasFailures = true;
        // Fast fail is safer for CI
        break;
    } else {
        console.log(`✅ [PASSED] ${script.name} [${duration}ms]\n`);
    }
}

console.log('==================================================');
if (hasFailures) {
    console.error('⛔ DEPLOYMENT REJECTED: One or more governance gates failed.');
    process.exit(1);
} else {
    console.log('✅ DEPLOYMENT APPROVED: All governance gates passed successfully.');
    process.exit(0);
}
