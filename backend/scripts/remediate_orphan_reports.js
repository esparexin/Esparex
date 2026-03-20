#!/usr/bin/env node

/**
 * Legacy wrapper retained for backward compatibility.
 * Canonical implementation moved to TypeScript ops CLI:
 *   npm run ops -- report-orphan-remediate [--apply --yes]
 */

const path = require('path');
const { spawnSync } = require('child_process');

const backendRoot = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

const child = spawnSync(
  process.execPath,
  [
    '-r',
    'ts-node/register/transpile-only',
    '-r',
    'tsconfig-paths/register',
    'src/scripts/ops/index.ts',
    'report-orphan-remediate',
    ...args,
  ],
  {
    cwd: backendRoot,
    stdio: 'inherit',
  }
);

if (typeof child.status === 'number') {
  process.exit(child.status);
}

process.exit(1);

