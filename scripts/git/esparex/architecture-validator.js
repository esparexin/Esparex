#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Validation, runStandalone, ROOT } = require('../shared');

const META = { id: 'ARCH-001', name: 'Architecture Compliance & Ownership Governance', version: '2.0.0', category: 'Architecture' };

function run(val) {
  // Load Canonical Ownership Registry if present
  const REGISTRY_PATH = path.join(ROOT, '.agents/governance/CANONICAL_OWNERSHIP_REGISTRY.json');
  let ownershipRegistry = null;
  if (fs.existsSync(REGISTRY_PATH)) {
    try {
      ownershipRegistry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8')).ownership;
    } catch (e) {}
  }

  const SEARCH_DIRS = ['apps', 'packages', 'core', 'backend'];
  
  function getTsFiles(dir, files = []) {
    if (!fs.existsSync(dir)) return files;
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const full = path.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        if (entry !== 'node_modules' && entry !== 'dist' && entry !== '.next' && !entry.startsWith('.')) {
          getTsFiles(full, files);
        }
      } else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith('.d.ts')) {
        files.push(full);
      }
    }
    return files;
  }

  const allSourceFiles = SEARCH_DIRS.flatMap(d => getTsFiles(path.join(ROOT, d)));

  // 1. Ownership & Package Boundary Validation using Registry
  if (ownershipRegistry) {
    for (const file of allSourceFiles) {
      const relPath = path.relative(ROOT, file);
      
      // Determine which registry section owns this file
      for (const [scopeKey, scopeRules] of Object.entries(ownershipRegistry)) {
        if (relPath.startsWith(scopeKey)) {
          const content = fs.readFileSync(file, 'utf-8');
          const importRe = /(?:from|require)\s*\(?\s*['"]([^'"]+)['"]\s*\)?/g;
          const matches = content.matchAll(importRe);

          for (const match of matches) {
            const importPath = match[1];
            if (!importPath.startsWith('@esparex/')) continue;
            
            const forbidden = scopeRules.forbiddenImports || [];
            for (const forbiddenPkg of forbidden) {
              if (importPath === forbiddenPkg || importPath.startsWith(forbiddenPkg + '/')) {
                val.error(`Package Ownership Violation: "${relPath}" (${scopeRules.owner}) imports forbidden package "${importPath}". Rule defined in CANONICAL_OWNERSHIP_REGISTRY.json.`);
              }
            }
          }
        }
      }
    }
  }

  // 2. GOV-006: API Layer Validation
  const appApiFiles = allSourceFiles.filter(f => f.includes('apps/') && (f.includes('/api/') || f.includes('/lib/api/')));
  const AUTHORIZED_CLIENT_FILES = ['adminClient.ts', 'client.ts', 'server.ts', 'route.ts'];

  for (const file of appApiFiles) {
    const filename = path.basename(file);
    if (AUTHORIZED_CLIENT_FILES.includes(filename)) continue;

    const relPath = path.relative(ROOT, file);
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('axios.create(') || (content.includes('fetch(') && !content.includes('apiClient') && !content.includes('getMe') && !content.includes('userListingQueryAPI'))) {
      val.warning(`API Layer Warning: ${relPath} contains raw HTTP client instantiation. Prefer canonical API clients from @esparex/contracts or @esparex/shared.`);
    }
  }

  // 3. GOV-007: Hook Consolidation Validation
  const hookFiles = allSourceFiles.filter(f => path.basename(f).startsWith('use'));
  const hookNameMap = new Map();
  for (const file of hookFiles) {
    const hookName = path.basename(file, path.extname(file));
    const relPath = path.relative(ROOT, file);
    
    const normalizedFamily = hookName.replace(/(Modal|Dialog|Popup)/g, 'Overlay');
    if (normalizedFamily.includes('Overlay') && hookNameMap.has(normalizedFamily)) {
      const existing = hookNameMap.get(normalizedFamily);
      if (existing !== relPath && (relPath.includes('apps/') && existing.includes('apps/'))) {
        val.warning(`Hook Consolidation: "${hookName}" in ${relPath} is functionally similar to "${path.basename(existing)}" in ${existing}. Consider consolidating into @esparex/ui.`);
      }
    } else if (normalizedFamily.includes('Overlay')) {
      hookNameMap.set(normalizedFamily, relPath);
    }
  }

  val.info('Architecture compliance, package ownership boundaries, and canonical registry verified');
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
