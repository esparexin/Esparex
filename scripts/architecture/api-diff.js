/**
 * api-diff.js
 * ===========
 * Public API Diff Engine (Architecture v1.1.0)
 *
 * Compares the exported symbols and type signatures of the 14 public namespaces
 * of @esparex/core between a base Git commit (default: main) and a head commit (default: HEAD).
 *
 * Usage:
 *   node scripts/architecture/api-diff.js --base=main --head=HEAD
 */

'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

// Parse CLI arguments
const args = process.argv.slice(2);
const baseCommit = args.find(a => a.startsWith('--base='))?.split('=')[1] || 'main';
const headCommit = args.find(a => a.startsWith('--head='))?.split('=')[1] || 'HEAD';

const ROOT = path.resolve(__dirname, '../..');
const TEMP_DIR = path.join(ROOT, 'node_modules', '.tmp-base-api-diff');

const NAMESPACES = [
  'core', // root index
  'core/models',
  'core/services',
  'core/events',
  'core/utils',
  'core/config',
  'core/infrastructure',
  'core/types',
  'core/validators',
  'core/jobs',
  'core/queues',
  'core/workers',
  'core/domain',
  'core/tooling'
];

function getNamespacePath(ns, isBase = false) {
  const prefix = isBase ? TEMP_DIR : ROOT;
  if (ns === 'core') {
    return path.join(prefix, 'core', 'src', 'index.ts');
  }
  const sub = ns.replace('core/', '');
  return path.join(prefix, 'core', 'src', sub, 'index.ts');
}

// ─── Git Archive Extractor ─────────────────────────────────────────────────────

function extractBaseCommitFiles() {
  console.log(`📦 Archiving core/src and shared/src at commit [${baseCommit}]...`);
  
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  const archivePath = path.join(ROOT, 'base-archive.zip');
  
  // Archive core/src and shared/src from baseCommit
  const gitArch = spawnSync(
    'git',
    ['archive', '--format=zip', '-o', archivePath, baseCommit, 'core/src', 'shared/src'],
    { cwd: ROOT, encoding: 'utf8' }
  );

  if (gitArch.status !== 0) {
    throw new Error(`Failed to run git archive: ${gitArch.stderr}`);
  }

  // Extract archive on Windows using PowerShell
  const extract = spawnSync(
    'powershell',
    ['-Command', `Expand-Archive -Path "${archivePath}" -DestinationPath "${TEMP_DIR}" -Force`],
    { cwd: ROOT, encoding: 'utf8' }
  );

  if (fs.existsSync(archivePath)) {
    fs.unlinkSync(archivePath);
  }

  if (extract.status !== 0) {
    throw new Error(`Failed to extract base archive: ${extract.stderr}`);
  }

  console.log(`✅ Base commit files extracted to temp directory.`);
}

// ─── TS Export Extractor ────────────────────────────────────────────────────────

function extractExports(entryPoint, isBase = false) {
  if (!fs.existsSync(entryPoint)) {
    return {};
  }

  const prefix = isBase ? TEMP_DIR : ROOT;

  const program = ts.createProgram([entryPoint], {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    baseUrl: prefix,
    paths: {
      "@esparex/shared": [path.join(prefix, 'shared', 'src')]
    }
  });

  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(entryPoint);
  if (!sourceFile) return {};

  const fileSymbol = checker.getSymbolAtLocation(sourceFile);
  if (!fileSymbol) return {};

  const exportedSymbols = checker.getExportsOfModule(fileSymbol);
  const exportsMap = {};

  for (const sym of exportedSymbols) {
    const name = sym.getName();
    const decl = sym.valueDeclaration || (sym.declarations && sym.declarations[0]);
    let typeStr = 'any';
    if (decl) {
      try {
        const type = checker.getTypeOfSymbolAtLocation(sym, decl);
        typeStr = checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation);
      } catch (e) {
        typeStr = 'error: ' + e.message;
      }
    }
    exportsMap[name] = { type: typeStr };
  }

  return exportsMap;
}

// ─── API Diff Runner ───────────────────────────────────────────────────────────

function main() {
  console.log(`\n======================================================`);
  console.log(`         Esparex Public API Diff Engine               `);
  console.log(`         Comparing: [${baseCommit}] ➔ [${headCommit}]  `);
  console.log(`======================================================\n`);

  try {
    extractBaseCommitFiles();
  } catch (err) {
    console.error(`❌ Failed to extract base commit files:`, err.message);
    process.exit(1);
  }

  const diffReport = [];
  let hasBreakingChanges = false;

  for (const ns of NAMESPACES) {
    const displayName = `@esparex/${ns}`;
    const baseEntry = getNamespacePath(ns, true);
    const headEntry = getNamespacePath(ns, false);

    const baseExports = extractExports(baseEntry, true);
    const headExports = extractExports(headEntry, false);

    const added = [];
    const removed = [];
    const modified = [];

    // Check for removed and modified exports
    for (const [name, info] of Object.entries(baseExports)) {
      if (!headExports[name]) {
        removed.push(name);
        hasBreakingChanges = true;
      } else if (headExports[name].type !== info.type) {
        modified.push({
          name,
          oldType: info.type,
          newType: headExports[name].type
        });
        hasBreakingChanges = true; // signature change is potentially breaking
      }
    }

    // Check for added exports
    for (const name of Object.keys(headExports)) {
      if (!baseExports[name]) {
        added.push(name);
      }
    }

    if (added.length > 0 || removed.length > 0 || modified.length > 0) {
      diffReport.push({
        namespace: displayName,
        added,
        removed,
        modified
      });
    }
  }

  // Clean up temp directory
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  // Print results
  console.log(`\n======================= REPORT =======================\n`);
  if (diffReport.length === 0) {
    console.log(`✅ No public API changes detected.`);
    process.exit(0);
  }

  for (const rep of diffReport) {
    console.log(`📦 ${rep.namespace}`);
    if (rep.removed.length > 0) {
      console.log(`  ❌ Removed Exports (BREAKING):`);
      rep.removed.forEach(name => console.log(`     - ${name}`));
    }
    if (rep.modified.length > 0) {
      console.log(`  ⚠️  Modified Signatures (POTENTIALLY BREAKING):`);
      rep.modified.forEach(m => {
        console.log(`     - ${m.name}`);
        console.log(`       Old: ${m.oldType}`);
        console.log(`       New: ${m.newType}`);
      });
    }
    if (rep.added.length > 0) {
      console.log(`  ✅ Added Exports (SAFE):`);
      rep.added.forEach(name => console.log(`     - ${name}`));
    }
    console.log();
  }

  console.log(`──────────────────────────────────────────────────────`);
  if (hasBreakingChanges) {
    console.log(`❌ Public API breaking changes found. Please review before merge.`);
    process.exit(1);
  } else {
    console.log(`✅ Public API changes are non-breaking (additions only).`);
    process.exit(0);
  }
}

main();
