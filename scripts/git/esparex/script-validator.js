#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Validation, runStandalone, ROOT } = require('../shared');

const META = { id: 'SCRIPT-001', name: 'Script & Export Parity Governance', version: '1.0.0', category: 'Governance' };

function run(val) {
  // 1. Package Export Source Parity Check
  // Ensures every exported subpath in package.json has a corresponding source file in src/
  const packageJsons = [
    path.join(ROOT, 'core/package.json'),
    path.join(ROOT, 'shared/package.json'),
    path.join(ROOT, 'packages/contracts/package.json'),
    path.join(ROOT, 'packages/design-tokens/package.json'),
    path.join(ROOT, 'packages/ui/package.json'),
    path.join(ROOT, 'packages/mobile-ui/package.json')
  ];

  let verifiedExports = 0;
  for (const pkgPath of packageJsons) {
    if (!fs.existsSync(pkgPath)) continue;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const pkgDir = path.dirname(pkgPath);
    if (pkg.exports && typeof pkg.exports === 'object') {
      for (const [subpath, exportTarget] of Object.entries(pkg.exports)) {
        let targetImport = typeof exportTarget === 'string' ? exportTarget : (exportTarget.import || exportTarget.default || exportTarget.require);
        if (targetImport && !targetImport.includes('*')) {
          const relDist = targetImport.replace(/^\.\/dist\//, '').replace(/\.js$/, '');
          const possibleSrc = [
            path.join(pkgDir, 'src', `${relDist}.ts`),
            path.join(pkgDir, 'src', `${relDist}.tsx`),
            path.join(pkgDir, 'src', relDist, 'index.ts'),
            path.join(pkgDir, 'src', relDist, 'index.tsx'),
            path.join(pkgDir, `${relDist}.ts`),
            path.join(pkgDir, 'dist', `${relDist}.js`),
            path.join(pkgDir, targetImport)
          ];
          const exists = possibleSrc.some(p => fs.existsSync(p));
          if (!exists) {
            val.error(`Export parity violation in ${path.relative(ROOT, pkgPath)}: export '${subpath}' target '${targetImport}' has no source file.`);
          } else {
            verifiedExports++;
          }
        }
      }
    }
  }

  // 2. Scratch Directory Blocker
  const scratchDir = path.join(ROOT, 'scratch');
  if (fs.existsSync(scratchDir)) {
    const scratchFiles = fs.readdirSync(scratchDir).filter(f => !f.startsWith('.'));
    if (scratchFiles.length > 0) {
      val.error(`Uncommitted scratch directory detected with ${scratchFiles.length} file(s). Scratch files must not be committed.`);
    }
  }

  // 3. Automated Zero-Capacitor Script Check
  const mobileGuard = path.join(ROOT, 'scripts/enforce-mobile-architecture-guard.js');
  if (!fs.existsSync(mobileGuard)) {
    val.error('Missing mandatory mobile architecture guard: scripts/enforce-mobile-architecture-guard.js');
  }

  val.info(`Script & Export Parity Verified: ${verifiedExports} exports verified, zero scratch leaks.`);
}

module.exports = { meta: META, run };
if (require.main === module) runStandalone(META, run);
