#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const corePackagePath = path.join(repoRoot, 'core', 'package.json');
const coreTsconfigPath = path.join(repoRoot, 'core', 'tsconfig.json');
const coreDistPath = path.join(repoRoot, 'core', 'dist');
const backendUserSrcPath = path.join(repoRoot, 'backend', 'user', 'src');

const toPosix = (value) => value.split(path.sep).join('/');

const escapeRegExp = (value) =>
  value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');

const wildcardToRegex = (pattern) => {
  const escaped = escapeRegExp(pattern).replace(/\*/g, '(.+)');
  return new RegExp(`^${escaped}$`);
};

const listFiles = (baseDir) => {
  const files = [];
  const walk = (currentDir) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const absPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(absPath);
        continue;
      }
      if (!entry.isFile()) continue;
      files.push(toPosix(path.relative(baseDir, absPath)));
    }
  };
  walk(baseDir);
  return files;
};

if (!fs.existsSync(corePackagePath)) {
  console.error('[guard:core-export-parity] Missing core/package.json.');
  process.exit(1);
}

if (!fs.existsSync(coreTsconfigPath)) {
  console.error('[guard:core-export-parity] Missing core/tsconfig.json.');
  process.exit(1);
}

if (!fs.existsSync(coreDistPath)) {
  console.error('[guard:core-export-parity] Missing core/dist. Run `npm run build -w @esparex/core` first.');
  process.exit(1);
}

const corePackage = JSON.parse(fs.readFileSync(corePackagePath, 'utf8'));
const coreTsconfig = JSON.parse(fs.readFileSync(coreTsconfigPath, 'utf8'));
const exportsField = corePackage.exports || {};
const distFiles = listFiles(coreDistPath);
const distFileSet = new Set(distFiles);

const failures = [];
const successes = [];

if (coreTsconfig?.compilerOptions?.declaration !== true) {
  failures.push('core/tsconfig.json must set compilerOptions.declaration=true for Render type parity');
}

const expectedDeclarationPath = (distPattern) => distPattern.replace(/\.js$/, '.d.ts');

for (const [subpath, target] of Object.entries(exportsField)) {
  if (typeof target !== 'string') {
    failures.push(`${subpath}: non-string export target is not supported by this guard`);
    continue;
  }

  const normalizedTarget = target.replace(/^\.\//, '');
  if (!normalizedTarget.startsWith('dist/')) {
    failures.push(`${subpath}: target must resolve under core/dist, received "${target}"`);
    continue;
  }

  const distPattern = normalizedTarget.replace(/^dist\//, '');

  if (distPattern.includes('*')) {
    const regex = wildcardToRegex(distPattern);
    const matches = distFiles.filter((file) => regex.test(file));
    if (matches.length === 0) {
      failures.push(`${subpath}: no emitted files matched "${target}"`);
      continue;
    }
    const missingDeclarations = matches
      .map((file) => expectedDeclarationPath(file))
      .filter((dtsPath) => !distFileSet.has(dtsPath));
    if (missingDeclarations.length > 0) {
      failures.push(
        `${subpath}: missing declaration files for ${missingDeclarations.length} emitted JS file(s)`
      );
      continue;
    }
    successes.push(`${subpath}: ${matches.length} emitted file(s) matched`);
    continue;
  }

  if (!distFiles.includes(distPattern)) {
    failures.push(`${subpath}: missing emitted file "${target}"`);
    continue;
  }

  const declarationPath = expectedDeclarationPath(distPattern);
  if (!distFileSet.has(declarationPath)) {
    failures.push(`${subpath}: missing emitted declaration file "./dist/${declarationPath}"`);
    continue;
  }

  successes.push(`${subpath}: emitted file found`);
}

const readTextFiles = (baseDir) => {
  const files = [];
  const walk = (currentDir) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const absPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(absPath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!/\.(ts|tsx)$/.test(entry.name)) continue;
      files.push(absPath);
    }
  };
  walk(baseDir);
  return files;
};

const resolveCoreDeclarationPath = (subpath) => {
  if (!subpath) {
    return 'index.d.ts';
  }

  if (subpath.endsWith('.js')) {
    const withoutJs = subpath.slice(0, -3);
    return `${withoutJs}.d.ts`;
  }

  return `${subpath}.d.ts`;
};

const hasCoreDeclarationForImport = (subpath) => {
  const basePath = resolveCoreDeclarationPath(subpath);
  if (distFileSet.has(basePath)) return true;
  if (distFileSet.has(basePath.replace(/\.d\.ts$/, '/index.d.ts'))) return true;
  return false;
};

if (!fs.existsSync(backendUserSrcPath)) {
  failures.push('Missing backend/api/src directory for import parity checks');
} else {
  const backendFiles = readTextFiles(backendUserSrcPath);
  const importRegex = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)['"]@esparex\/core(?:\/([^'"]+))?['"]/g;
  const coreSubpaths = new Set();

  for (const filePath of backendFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    let match = importRegex.exec(content);
    while (match) {
      const subpath = match[1] || '';
      coreSubpaths.add(subpath);
      match = importRegex.exec(content);
    }
  }

  for (const subpath of Array.from(coreSubpaths).sort()) {
    if (!hasCoreDeclarationForImport(subpath)) {
      failures.push(
        `backend import "@esparex/core${subpath ? `/${subpath}` : ''}" has no matching core/dist declaration`
      );
    }
  }

  successes.push(`backend import parity verified for ${coreSubpaths.size} @esparex/core import path(s)`);
}

if (failures.length > 0) {
  console.error('[guard:core-export-parity] Export parity check failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('[guard:core-export-parity] Export parity check passed.');
for (const success of successes) {
  console.log(`- ${success}`);
}
