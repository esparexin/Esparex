#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Validation, runStandalone, ROOT } = require('../shared');

const META = { id: 'ARCH-001', name: 'Architecture Compliance', version: '1.0.0', category: 'Architecture' };

function run(val) {
  // 1. Boundary & Backend Import Check
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

  // 2. GOV-006: API Layer Validation
  // Ensure apps do not declare raw un-abstracted API instances outside canonical client files
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
  // Check for duplicate hook definitions across apps and packages (e.g. useModal vs useDialog vs usePopup)
  const hookFiles = allSourceFiles.filter(f => path.basename(f).startsWith('use'));
  const hookNameMap = new Map();
  for (const file of hookFiles) {
    const hookName = path.basename(file, path.extname(file));
    const relPath = path.relative(ROOT, file);
    
    // Group hooks by similarity family (e.g. popup/dialog/modal)
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

  // 4. Changed Files Architecture Enforcement
  const changedFiles = (() => {
    try {
      const out = execSync('git diff --cached --name-only --diff-filter=ACMR', { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      return out.split('\n').filter(Boolean);
    } catch { return []; }
  })();

  const srcFiles = changedFiles.filter(f => /\.(ts|tsx|js|jsx)$/.test(f) && !f.includes('node_modules'));
  for (const file of srcFiles) {
    const fullPath = path.join(ROOT, file);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf-8');

    const importRe = /(?:from|require)\s*\(?\s*['"]([^'"]+)['"]\s*\)?/g;
    const matches = content.matchAll(importRe);

    for (const match of matches) {
      const importPath = match[1];
      if (!importPath.startsWith('@esparex/')) continue;
      const isInApps = file.startsWith('apps/');
      if (isInApps && importPath.replace('@esparex/', '').startsWith('backend')) {
        val.error(`Architecture Violation: ${file} imports backend "${importPath}". Apps must not import backend directly.`);
      }
    }
  }

  val.info('Architecture compliance, API layer, and hook consolidation verified');
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
