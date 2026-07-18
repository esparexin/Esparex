#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Validation, runStandalone, ROOT } = require('../shared');

const META = { id: 'CONTRACT-001', name: 'Contract Validation', version: '1.0.0', category: 'Architecture' };

function getAllWorkspacePackages() {
  const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
  const result = {};

  function resolveGlob(pattern) {
    const parts = pattern.split(/[\\/]/);
    function walk(base, idx) {
      if (idx === parts.length) {
        if (fs.existsSync(base) && fs.statSync(base).isDirectory()) {
          const p = path.join(base, 'package.json');
          if (fs.existsSync(p)) {
            const pkg = JSON.parse(fs.readFileSync(p, 'utf-8'));
            if (pkg.name) result[pkg.name] = p;
          }
        }
        return;
      }
      const part = parts[idx];
      if (part === '*') {
        let entries;
        try { entries = fs.readdirSync(base, { withFileTypes: true }); } catch { return; }
        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            walk(path.join(base, entry.name), idx + 1);
          }
        }
      } else {
        walk(path.join(base, part), idx + 1);
      }
    }
    walk(ROOT, 0);
  }

  for (const pat of (rootPkg.workspaces || [])) resolveGlob(pat);
  return result;
}

function run(val) {
  const changedFiles = (() => {
    try {
      const out = execSync('git diff --cached --name-only --diff-filter=ACMR', { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      return out.split('\n').filter(Boolean);
    } catch { return []; }
  })();

  const stagedPkgFiles = changedFiles.filter(f => f.endsWith('package.json'));
  if (stagedPkgFiles.length === 0) return;

  const workspacePkgs = getAllWorkspacePackages();
  const nameCounts = {};
  for (const [name] of Object.entries(workspacePkgs)) {
    nameCounts[name] = (nameCounts[name] || 0) + 1;
  }

  for (const [name, count] of Object.entries(nameCounts)) {
    if (count > 1) {
      val.error(`Package name "${name}" defined ${count} times in workspace.`);
    }
  }

  for (const file of stagedPkgFiles) {
    const fullPath = path.join(ROOT, file);
    if (!fs.existsSync(fullPath)) continue;
    const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    for (const [dep, ver] of Object.entries(allDeps)) {
      if (ver === '*' || ver === 'workspace:*' || ver.startsWith('workspace:')) {
        if (!workspacePkgs[dep]) {
          val.error(`"${dep}" referenced by ${file} does not exist as a workspace package.`);
        }
      }
    }
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
