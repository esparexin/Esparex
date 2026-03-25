#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SCAN_DIRS = [
  'backend/src',
  'frontend/src',
  'admin-frontend/src',
  'shared'
];
const PACKAGE_MANIFESTS = [
  { manifest: 'package.json', root: '' },
  { manifest: 'backend/package.json', root: 'backend' },
  { manifest: 'frontend/package.json', root: 'frontend' },
  { manifest: 'admin-frontend/package.json', root: 'admin-frontend' }
];
const SCRIPT_ENTRY_PATTERN = /((?:\.\.\/)?(?:backend\/src|frontend\/src|admin-frontend\/src|shared|src)\/[A-Za-z0-9_./-]+\.(?:ts|tsx|js|jsx|mjs|cjs))/g;
const VALID_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const SOURCE_ENTRY_PATTERNS = [
  /[\\/]app[\\/](?:.*[\\/])?(page|layout|route|loading|error|global-error|not-found|template|sitemap|robots)\.(ts|tsx|js|jsx)$/,
  /[\\/]proxy\.(ts|tsx|js|jsx)$/,
  /[\\/]middleware\.(ts|tsx|js|jsx)$/,
  /[\\/]instrumentation\.(ts|tsx|js|jsx)$/
];
const NEVER_AUTO_DELETE_PATTERNS = [
  /(\.test\.|\.spec\.|\/__tests__\/|\/__mocks__\/)/,
  /[\\/]app[\\/](?:.*[\\/])?(page|layout|route|loading|error|global-error|not-found|template|sitemap|robots)\.(ts|tsx|js|jsx)$/,
  /[\\/]proxy\.(ts|tsx|js|jsx)$/,
  /[\\/]middleware\.(ts|tsx|js|jsx)$/
];
const ALWAYS_KEEP_PATTERNS = [
  /^backend\/src\/config\/loadEnv\.ts$/,
  /^backend\/src\/config\/mongoosePlugins\.ts$/,
  /^backend\/src\/models\/registry\.ts$/,
  /^backend\/src\/scripts\/restore-database\.ts$/,
  /^backend\/src\/seeds\/(devices\.seed|runSeeds|spareParts\.seed)\.ts$/,
  /^backend\/src\/tests\//,
  /^backend\/src\/__tests__\//,
  /^frontend\/src\/__tests__\//
];
const IMPORT_PATTERNS = [
  /\bimport\s+(?:type\s+)?[^'"]*?from\s*['"]([^'"]+)['"]/g,
  /\bexport\s+[^'"]*?from\s*['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g
];

const reportOutput = process.argv.includes('--report')
  ? process.argv[process.argv.indexOf('--report') + 1]
  : '/tmp/repo_orphan_report.json';
const safeOutput = process.argv.includes('--safe')
  ? process.argv[process.argv.indexOf('--safe') + 1]
  : '/tmp/repo_orphan_safe_candidates.json';

const normalizePath = (p) => p.split(path.sep).join('/');
const isSourceFile = (filePath) => {
  if (!VALID_EXTENSIONS.has(path.extname(filePath))) return false;
  if (filePath.endsWith('.d.ts')) return false;
  if (filePath.includes('/dist/')) return false;
  if (filePath.includes('/node_modules/')) return false;
  if (filePath.includes('/coverage/')) return false;
  return true;
};

const collectFiles = () => {
  const files = [];
  const walk = (absDir) => {
    if (!fs.existsSync(absDir)) return;
    for (const dirent of fs.readdirSync(absDir, { withFileTypes: true })) {
      const absPath = path.join(absDir, dirent.name);
      if (dirent.isDirectory()) {
        walk(absPath);
        continue;
      }
      const rel = normalizePath(path.relative(ROOT, absPath));
      if (isSourceFile(rel)) files.push(rel);
    }
  };

  for (const dir of SCAN_DIRS) walk(path.join(ROOT, dir));
  return files.sort();
};

const resolveWithExtensions = (basePath) => {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    `${basePath}.mjs`,
    `${basePath}.cjs`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.js'),
    path.join(basePath, 'index.jsx'),
    path.join(basePath, 'index.mjs'),
    path.join(basePath, 'index.cjs')
  ];

  for (const candidate of candidates) {
    const rel = normalizePath(path.relative(ROOT, candidate));
    if (fs.existsSync(candidate) && isSourceFile(rel)) {
      return rel;
    }
  }
  return null;
};

const resolveAlias = (specifier, importer) => {
  if (specifier.startsWith('@/')) {
    const isAdminImporter = importer.startsWith('admin-frontend/src/');
    const base = isAdminImporter ? 'admin-frontend/src' : 'frontend/src';
    return resolveWithExtensions(path.join(ROOT, base, specifier.slice(2)));
  }
  if (specifier === '@shared') {
    return resolveWithExtensions(path.join(ROOT, 'shared', 'index'));
  }
  if (specifier.startsWith('@shared/')) {
    return resolveWithExtensions(path.join(ROOT, 'shared', specifier.slice('@shared/'.length)));
  }
  if (specifier.startsWith('shared/')) {
    return resolveWithExtensions(path.join(ROOT, specifier));
  }
  return null;
};

const resolveImport = (specifier, importer) => {
  if (!specifier || specifier.startsWith('http')) return null;

  if (specifier.startsWith('.')) {
    const importerAbs = path.join(ROOT, importer);
    const resolvedBase = path.resolve(path.dirname(importerAbs), specifier);
    return resolveWithExtensions(resolvedBase);
  }

  return resolveAlias(specifier, importer);
};

const collectImports = (filePath) => {
  const content = fs.readFileSync(path.join(ROOT, filePath), 'utf8');
  const imports = [];
  for (const pattern of IMPORT_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const specifier = match[1];
      if (specifier) imports.push(specifier);
    }
  }
  return imports;
};

const buildGraph = (files) => {
  const graph = new Map();
  for (const file of files) graph.set(file, new Set());

  for (const file of files) {
    const imports = collectImports(file);
    for (const specifier of imports) {
      const resolved = resolveImport(specifier, file);
      if (resolved && graph.has(resolved)) {
        graph.get(file).add(resolved);
      }
    }
  }
  return graph;
};

const collectPackageScriptRoots = (files) => {
  const fileSet = new Set(files);
  const roots = new Set();

  for (const { manifest, root } of PACKAGE_MANIFESTS) {
    const manifestPath = path.join(ROOT, manifest);
    if (!fs.existsSync(manifestPath)) continue;

    let pkg;
    try {
      pkg = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch {
      continue;
    }

    const scripts = pkg && typeof pkg === 'object' ? pkg.scripts : null;
    if (!scripts || typeof scripts !== 'object') continue;

    for (const command of Object.values(scripts)) {
      if (typeof command !== 'string') continue;

      SCRIPT_ENTRY_PATTERN.lastIndex = 0;
      let match;
      while ((match = SCRIPT_ENTRY_PATTERN.exec(command)) !== null) {
        const entry = match[1];
        if (!entry) continue;

        const absPath = path.resolve(ROOT, root, entry);
        const relPath = normalizePath(path.relative(ROOT, absPath));
        if (fileSet.has(relPath)) roots.add(relPath);
      }
    }
  }

  return [...roots];
};

const isRootFile = (filePath) => {
  if (filePath === 'backend/src/index.ts') return true;
  if (filePath === 'backend/src/server.ts') return true;
  if (filePath === 'backend/src/app.ts') return true;
  if (filePath === 'backend/src/workers/index.ts') return true;
  if (filePath === 'backend/src/workers.ts') return true;
  if (filePath.endsWith('/routes.ts')) return true;
  return SOURCE_ENTRY_PATTERNS.some((pattern) => pattern.test(filePath));
};

const reachableFromRoots = (graph, roots) => {
  const visited = new Set();
  const queue = [...roots];
  while (queue.length > 0) {
    const node = queue.shift();
    if (visited.has(node)) continue;
    visited.add(node);
    const edges = graph.get(node);
    if (!edges) continue;
    for (const next of edges) {
      if (!visited.has(next)) queue.push(next);
    }
  }
  return visited;
};

const classifyTier = (filePath) => {
  if (isNeverAutoDelete(filePath)) return 'C';
  if (/^frontend\/src\/(api|context)\//.test(filePath)) return 'B';
  if (/^admin-frontend\/src\/(lib\/api|context)\//.test(filePath)) return 'B';
  return 'C';
};

const isNeverAutoDelete = (filePath) =>
  NEVER_AUTO_DELETE_PATTERNS.some((pattern) => pattern.test(filePath));

const isAlwaysKeep = (filePath) =>
  ALWAYS_KEEP_PATTERNS.some((pattern) => pattern.test(filePath));

const main = () => {
  const generatedAt = new Date().toISOString();
  const files = collectFiles();
  const graph = buildGraph(files);
  const packageScriptRoots = collectPackageScriptRoots(files);
  const roots = [...new Set([
    ...files.filter((filePath) => isRootFile(filePath) || isAlwaysKeep(filePath)),
    ...packageScriptRoots
  ])];
  const reachable = reachableFromRoots(graph, roots);

  const orphanFiles = files.filter((f) => !reachable.has(f));
  const orphanFilesByProject = orphanFiles.reduce((acc, filePath) => {
    const project = filePath.split('/')[0];
    acc[project] = (acc[project] || 0) + 1;
    return acc;
  }, {});

  const tierA = [];
  const tierB = [];
  const tierC = [];
  for (const orphan of orphanFiles) {
    const tier = classifyTier(orphan);
    if (tier === 'A') tierA.push(orphan);
    else if (tier === 'B') tierB.push(orphan);
    else tierC.push(orphan);
  }

  const safeDeleteCandidates = [...tierA, ...tierB]
    .filter((filePath) => !isNeverAutoDelete(filePath) && !isAlwaysKeep(filePath));

  const report = {
    generatedAt,
    method: 'import-graph with package-script roots (ts-prune unavailable in offline environment)',
    scannedFiles: files.length,
    rootCount: roots.length,
    packageScriptRootCount: packageScriptRoots.length,
    orphanCount: orphanFiles.length,
    orphanFilesByProject,
    safeDeleteCandidateCount: safeDeleteCandidates.length,
    safeDeleteCandidates
  };

  const safe = {
    generatedAt,
    method: 'import-graph tiering with package-script roots',
    tierA,
    tierB,
    tierC,
    totals: {
      tierA: tierA.length,
      tierB: tierB.length,
      tierC: tierC.length
    }
  };

  fs.writeFileSync(reportOutput, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(safeOutput, `${JSON.stringify(safe, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    report: reportOutput,
    safeCandidates: safeOutput,
    scannedFiles: report.scannedFiles,
    roots: report.rootCount,
    orphanCount: report.orphanCount,
    tierA: safe.totals.tierA,
    tierB: safe.totals.tierB,
    tierC: safe.totals.tierC
  }, null, 2));
};

main();
