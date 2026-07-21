const fs = require('fs');
const path = require('path');

const targets = {
  '--backend': [
    'backend/api/dist',
    'backend/api/tsconfig.tsbuildinfo'
  ],
  '--web': [
    'apps/web/.next',
    'apps/web/tsconfig.tsbuildinfo'
  ],
  '--admin': [
    'apps/admin/.next',
    'apps/admin/tsconfig.tsbuildinfo'
  ],
  '--shared': [
    'shared/dist',
    'shared/tsconfig.tsbuildinfo'
  ],
  '--contracts': [
    'packages/contracts/dist',
    'packages/contracts/tsconfig.tsbuildinfo'
  ],
  '--core': [
    'core/dist',
    'core/tsconfig.tsbuildinfo'
  ],
  '--kernel': [
    'packages/kernel/dist',
    'packages/kernel/tsconfig.tsbuildinfo'
  ],
  '--ui': [
    'packages/ui/dist',
    'packages/ui/tsconfig.tsbuildinfo'
  ]
};

const rootDir = path.resolve(__dirname, '..');
const arg = process.argv[2];

function cleanPaths(paths) {
  paths.forEach(target => {
    const fullPath = path.resolve(rootDir, target);
    if (fs.existsSync(fullPath)) {
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`✓ Cleaned: ${target}`);
      } catch (err) {
        console.error(`✗ Failed to clean ${target}:`, err.message);
      }
    }
  });
}

if (arg) {
  if (targets[arg]) {
    console.log(`Cleaning workspace target: ${arg}`);
    cleanPaths(targets[arg]);
  } else {
    console.error(`Unknown clean target: ${arg}`);
    process.exit(1);
  }
} else {
  console.log('Cleaning all workspaces and cache directories...');
  // Clean everything
  Object.values(targets).forEach(paths => cleanPaths(paths));
  // Clean root cache directories
  cleanPaths(['.eslintcache', '.tooling/.cache']);
}
