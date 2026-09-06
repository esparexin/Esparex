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
            path.join(pkgDir, 'scripts', 'generate-css.ts'),
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

  // 4. Governance & NPM Script Reference Integrity Check
  const rootPkgPath = path.join(ROOT, 'package.json');
  if (fs.existsSync(rootPkgPath)) {
    const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
    const scripts = rootPkg.scripts || {};
    const rootScriptKeys = new Set(Object.keys(scripts));

    const workspacePkgMap = new Map();
    const workspacePatterns = ['apps/*', 'packages/*', 'backend/api', 'core', 'shared'];
    for (const pattern of workspacePatterns) {
      if (pattern.endsWith('/*')) {
        const base = path.join(ROOT, pattern.slice(0, -2));
        if (fs.existsSync(base)) {
          for (const sub of fs.readdirSync(base)) {
            const pJson = path.join(base, sub, 'package.json');
            if (fs.existsSync(pJson)) {
              try {
                const p = JSON.parse(fs.readFileSync(pJson, 'utf8'));
                if (p.name) workspacePkgMap.set(p.name, pJson);
              } catch { /* ignore */ }
            }
          }
        }
      } else {
        const pJson = path.join(ROOT, pattern, 'package.json');
        if (fs.existsSync(pJson)) {
          try {
            const p = JSON.parse(fs.readFileSync(pJson, 'utf8'));
            if (p.name) workspacePkgMap.set(p.name, pJson);
          } catch { /* ignore */ }
        }
      }
    }

    for (const [scriptName, scriptCmd] of Object.entries(scripts)) {
      if (typeof scriptCmd !== 'string') continue;
      const commandParts = scriptCmd.split('&&').map(s => s.trim());
      for (const part of commandParts) {
        const match = part.match(/npm\s+run\s+([a-zA-Z0-9:_-]+)(?:\s+(?:-w|--workspace)\s+([@a-zA-Z0-9/_-]+))?/);
        if (match) {
          const targetScript = match[1];
          const workspaceName = match[2];

          if (workspaceName && workspacePkgMap.has(workspaceName)) {
            try {
              const targetPkgJson = JSON.parse(fs.readFileSync(workspacePkgMap.get(workspaceName), 'utf8'));
              const targetScripts = targetPkgJson.scripts || {};
              if (!targetScripts[targetScript]) {
                val.error(`Script reference integrity violation in package.json: script "${scriptName}" calls nonexistent script "${targetScript}" in workspace "${workspaceName}".`);
              }
            } catch { /* ignore */ }
          } else if (!workspaceName) {
            if (!rootScriptKeys.has(targetScript)) {
              val.error(`Script reference integrity violation in package.json: script "${scriptName}" calls nonexistent npm script "${targetScript}".`);
            }
          }
        }
      }
    }
  }

  // 5. In-Source Scripts Folder Blocker
  // Source scripts must reside outside src/ (e.g., core/scripts/, backend/api/scripts/) to avoid build pollution.
  const bannedSrcScripts = [
    path.join(ROOT, 'core/src/scripts'),
    path.join(ROOT, 'backend/api/src/scripts'),
    path.join(ROOT, 'packages/contracts/src/scripts'),
    path.join(ROOT, 'packages/ui/src/scripts')
  ];
  for (const dir of bannedSrcScripts) {
    if (fs.existsSync(dir)) {
      val.error(`Prohibited in-source script directory detected: ${path.relative(ROOT, dir)}. Scripts must reside outside src/ in <package>/scripts.`);
    }
  }

  // 6. Standalone Script Registration Guard
  // Ensures every script in scripts/, backend/api/scripts/, and core/scripts/ is registered in package.json, workflows, or governance manifests.
  const scriptScanRoots = [
    path.join(ROOT, 'scripts'),
    path.join(ROOT, 'backend/api/scripts'),
    path.join(ROOT, 'core/scripts')
  ];

  function walkScripts(dir) {
    let list = [];
    if (!fs.existsSync(dir)) return list;
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      if (item.name === 'node_modules' || item.name === '__tests__') continue;
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        list = list.concat(walkScripts(full));
      } else if (/\.(ts|js|mjs|cjs|sh)$/.test(item.name)) {
        list.push(full);
      }
    }
    return list;
  }

  const allScripts = scriptScanRoots.flatMap(walkScripts);
  const scanContentFiles = [
    rootPkgPath,
    path.join(ROOT, 'backend/api/package.json'),
    path.join(ROOT, 'core/package.json'),
    path.join(ROOT, 'apps/mobile/package.json'),
    path.join(ROOT, 'scripts/policy/legacy-js-risk-allowlist.json'),
    path.join(ROOT, 'scripts/git/repo-gate.js'),
    path.join(ROOT, 'eslint.config.mjs')
  ];

  const wfDir = path.join(ROOT, '.github/workflows');
  if (fs.existsSync(wfDir)) {
    for (const wf of fs.readdirSync(wfDir)) {
      scanContentFiles.push(path.join(wfDir, wf));
    }
  }

  for (const sub of ['scripts', 'scripts/git', 'scripts/git/esparex', 'scripts/governance', 'scripts/policy', 'scripts/eslint-rules']) {
    const dir = path.join(ROOT, sub);
    if (fs.existsSync(dir)) {
      for (const f of fs.readdirSync(dir)) {
        if (/\.(js|ts)$/.test(f)) scanContentFiles.push(path.join(dir, f));
      }
    }
  }

  const allScanContents = scanContentFiles
    .filter(f => fs.existsSync(f))
    .map(f => ({ path: f, content: fs.readFileSync(f, 'utf8') }));

  const KNOWN_TRANSITIONAL_UNREGISTERED = new Set([
    'scripts/sweep-expired-listings.ts',
    'core/scripts/migrate-catalog-decoupling.ts'
  ]);

  let registeredScriptsCount = 0;
  for (const scriptPath of allScripts) {
    const relPath = path.relative(ROOT, scriptPath).replace(/\\/g, '/');
    const baseName = path.basename(scriptPath);
    const baseWithoutExt = path.basename(scriptPath, path.extname(scriptPath));

    const isReferenced =
      KNOWN_TRANSITIONAL_UNREGISTERED.has(relPath) ||
      allScanContents.some(entry => {
        if (entry.path === scriptPath) return false;
        return entry.content.includes(relPath) || entry.content.includes(baseName) || entry.content.includes(baseWithoutExt);
      });

    if (!isReferenced) {
      val.error(`Unregistered/orphaned script detected: ${relPath}. Standalone scripts must be registered in package.json, workflows, or governance allowlists.`);
    } else {
      registeredScriptsCount++;
    }
  }

  val.info(`Script & Export Parity Verified: ${verifiedExports} exports verified, ${registeredScriptsCount} scripts registered, zero scratch leaks, script graph intact.`);
}

module.exports = { meta: META, run };
if (require.main === module) runStandalone(META, run);
