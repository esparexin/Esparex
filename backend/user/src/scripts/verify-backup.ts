import { spawnSync } from 'child_process';
import path from 'path';

const target = path.resolve(__dirname, '../../../../core/src/scripts/verify-backup.ts');
const args = [target, ...process.argv.slice(2)];

const result = spawnSync('ts-node', args, {
    stdio: 'inherit',
    env: process.env,
});

process.exit(result.status ?? 1);
