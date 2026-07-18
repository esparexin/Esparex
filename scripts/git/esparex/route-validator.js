#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Validation, runStandalone, ROOT } = require('../shared');

const META = { id: 'ROUTE-001', name: 'Route Validation', version: '1.0.0', category: 'API' };

function run(val) {
  const changedFiles = (() => {
    try {
      const out = execSync('git diff --cached --name-only --diff-filter=ACMR', { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      return out.split('\n').filter(Boolean);
    } catch { return []; }
  })();

  const routeFiles = changedFiles.filter(f =>
    (f.endsWith('.ts') || f.endsWith('.js')) &&
    (f.includes('/routes/') || f.includes('/router') || f.endsWith('-routes.ts') || f.endsWith('.route.ts'))
  );

  if (routeFiles.length === 0) return;

  const routes = new Map();
  for (const file of routeFiles) {
    const fullPath = path.join(ROOT, file);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf-8');
    const routeMatches = content.match(/(?:router|route)\.(?:get|post|put|patch|delete|options)\s*\(\s*['"`](\/[^'"`]*)['"`]/gi);
    if (routeMatches) {
      for (const match of routeMatches) {
        const parts = match.split(/['"`]/);
        if (parts.length >= 2) {
          const routePath = parts[1];
          if (routes.has(routePath)) {
            val.error(`Duplicate route "${routePath}" in ${file} and ${routes.get(routePath)}`);
          } else {
            routes.set(routePath, file);
          }
        }
      }
    }
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
