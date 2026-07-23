#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Validation, runStandalone, ROOT } = require('../shared');

const META = { id: 'SSOT-001', name: 'SSOT & Canonical Ownership', version: '2.0.0', category: 'Architecture' };

function run(val) {
  // 1. Dynamic Canonical Symbol Discovery from Package Boundaries
  // Scans packages/*, shared/, core/ for exported symbols to dynamically determine canonical ownership
  const PACKAGE_DIRS = [
    { dir: 'packages/ui', name: '@esparex/ui' },
    { dir: 'packages/contracts', name: '@esparex/contracts' },
    { dir: 'shared', name: '@esparex/shared' },
    { dir: 'core', name: '@esparex/core' },
  ];

  const canonicalSymbolMap = new Map(); // symbol -> packageName

  function scanExports(dir, packageName) {
    const fullDir = path.join(ROOT, dir);
    if (!fs.existsSync(fullDir)) return;

    function getFiles(current) {
      let results = [];
      const list = fs.readdirSync(current);
      for (const item of list) {
        const p = path.join(current, item);
        const stat = fs.statSync(p);
        if (stat.isDirectory()) {
          if (item !== 'node_modules' && item !== 'dist' && !item.startsWith('.')) {
            results = results.concat(getFiles(p));
          }
        } else if (/\.(ts|tsx)$/.test(item) && !item.endsWith('.d.ts')) {
          results.push(p);
        }
      }
      return results;
    }

    const files = getFiles(fullDir);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const matches = content.matchAll(/^export\s+(?:const|function|class|interface|type|enum)\s+(\w+)/gm);
      for (const m of matches) {
        const symbol = m[1];
        if (!canonicalSymbolMap.has(symbol)) {
          canonicalSymbolMap.set(symbol, packageName);
        }
      }
    }
  }

  for (const pkg of PACKAGE_DIRS) {
    scanExports(pkg.dir, pkg.name);
  }

  // 2. Import & Ownership Analysis in Applications (apps/web, apps/admin)
  const appDirs = ['apps/web/src', 'apps/admin/src'];
  for (const appDir of appDirs) {
    const fullDir = path.join(ROOT, appDir);
    if (!fs.existsSync(fullDir)) continue;

    function checkAppFiles(current) {
      const list = fs.readdirSync(current);
      for (const item of list) {
        const p = path.join(current, item);
        const stat = fs.statSync(p);
        if (stat.isDirectory()) {
          if (item !== 'node_modules' && item !== '.next' && !item.startsWith('.')) {
            checkAppFiles(p);
          }
        } else if (/\.(ts|tsx)$/.test(item) && !item.endsWith('.d.ts')) {
          const content = fs.readFileSync(p, 'utf-8');
          const relPath = path.relative(ROOT, p);

          // Rule A: Verify imports — reject deep imports from dist
          const importMatches = content.matchAll(/from\s+['"](@esparex\/[^'"]+)['"]/g);
          for (const match of importMatches) {
            if (match[1].includes('/dist/')) {
              val.error(`Deep Import Violation: ${relPath} imports "${match[1]}". Import from package root instead.`);
            }
          }

          // Rule B: Dynamic Canonical Ownership & Import Resolution
          // Check if app file exports a local symbol that collides with a canonical package symbol
          const localExports = content.matchAll(/^export\s+(?:const|function|class|interface|type|enum)\s+(\w+)/gm);
          for (const exp of localExports) {
            const sym = exp[1];
            if (canonicalSymbolMap.has(sym)) {
              const canonicalOwner = canonicalSymbolMap.get(sym);
              // Allow local wrapper if file explicitly imports canonical symbol or is in page/route entry point
              const importsCanonical = content.includes(`from "${canonicalOwner}"`) || content.includes(`from '${canonicalOwner}'`);
              if (!importsCanonical && !relPath.includes('/app/') && !relPath.includes('/pages/')) {
                val.warning(`Canonical Ownership Violation: "${sym}" in ${relPath} collides with canonical symbol in ${canonicalOwner}. Import from ${canonicalOwner} instead.`);
              }
            }
          }
        }
      }
    }
    checkAppFiles(fullDir);
  }

  val.info('Dynamic canonical ownership and import resolution verified across workspace packages and applications');
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
