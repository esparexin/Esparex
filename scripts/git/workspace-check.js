#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Validation, runStandalone, ROOT } = require('./shared');

const META = { id: 'WORK-001', name: 'Workspace Validation', version: '1.0.0', category: 'Structure' };

function run(val) {
  const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
  const workspaceGlobs = rootPkg.workspaces || [];

  function resolveGlobToDirs(pattern) {
    const parts = pattern.split(/[\\/]/);
    const dirs = [];
    function walk(base, idx) {
      if (idx === parts.length) {
        if (fs.existsSync(base) && fs.statSync(base).isDirectory()) dirs.push(base);
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
    return dirs;
  }

  const matchedDirs = [];
  for (const pat of workspaceGlobs) {
    for (const dir of resolveGlobToDirs(pat)) {
      matchedDirs.push({ dir, relPath: path.relative(ROOT, dir) });
    }
  }

  const pkgNameMap = new Map();

  function isOrganizationalContainer(dir) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return false;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return false; }
    const subdirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));
    if (subdirs.length === 0) return false;
    return subdirs.some(sub => fs.existsSync(path.join(dir, sub.name, 'package.json')));
  }

  for (const { dir, relPath } of matchedDirs) {
    const pkgPath = path.join(dir, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      if (isOrganizationalContainer(dir)) continue;
      val.error(`Directory matched by workspace glob but missing package.json: ${relPath}`);
      continue;
    }
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    if (!pkg.name) {
      val.error(`${relPath}/package.json is missing the "name" field.`);
      continue;
    }
    if (pkgNameMap.has(pkg.name)) {
      val.error(`Duplicate package name "${pkg.name}" in ${relPath}/package.json and ${pkgNameMap.get(pkg.name)}`);
    } else {
      pkgNameMap.set(pkg.name, relPath + '/package.json');
    }
  }

  for (const { dir, relPath } of matchedDirs) {
    const pkgPath = path.join(dir, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}), ...(pkg.peerDependencies || {}) };
    for (const [depName, depVer] of Object.entries(allDeps)) {
      if (depVer === '*' || depVer === 'workspace:*' || depVer.startsWith('workspace:')) {
        if (!pkgNameMap.has(depName)) {
          val.error(`"${depName}" (workspace dependency) not found. Referenced by ${relPath}/package.json.`);
        }
      }
    }
  }

  const seen = new Set();
  function detectCircular(name, chain = []) {
    if (chain.includes(name)) {
      val.error(`Circular workspace dependency: ${chain.slice(chain.indexOf(name)).concat(name).join(' -> ')}`);
      return;
    }
    if (seen.has(name)) return;
    seen.add(name);
    const entry = pkgNameMap.get(name);
    if (!entry) return;
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, entry), 'utf-8'));
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}), ...(pkg.peerDependencies || {}) };
    for (const [depName, depVer] of Object.entries(deps)) {
      if ((depVer === '*' || depVer === 'workspace:*' || depVer.startsWith('workspace:')) && pkgNameMap.has(depName)) {
        detectCircular(depName, [...chain, name]);
      }
    }
  }
  for (const name of pkgNameMap.keys()) detectCircular(name);

  const lockPath = path.join(ROOT, 'package-lock.json');
  const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
  const lockWorkspaces = lockData.packages?.['']?.workspaces;
  if (lockWorkspaces) {
    const sortedRoot = [...workspaceGlobs].sort();
    const sortedLock = [...lockWorkspaces].sort();
    if (JSON.stringify(sortedRoot) !== JSON.stringify(sortedLock)) {
      val.error('package-lock.json workspaces array does not match package.json.');
    }
  }

  const otherLockFiles = [
    { name: 'pnpm-lock.yaml' }, { name: 'yarn.lock' }, { name: 'pnpm-lock.yml' },
  ];
  for (const lf of otherLockFiles) {
    if (fs.existsSync(path.join(ROOT, lf.name))) {
      val.error(`Mixed package manager: ${lf.name} found alongside npm.`);
    }
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
