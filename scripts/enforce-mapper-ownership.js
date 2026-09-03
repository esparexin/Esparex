#!/usr/bin/env node

/**
 * 🛡️  Esparex Architectural Guard: Mapper Ownership Standard
 *
 * Invariant:
 * 1. Repositories query persistence models and may convert persistence documents to domain entities,
 *    but presentation-model construction and presentation formatting must belong outside repositories.
 * 2. Repositories must not construct UI-formatted properties (formattedPrice, displayLocation, timeAgo)
 *    or invoke presentation formatters (formatPrice, formatDate, formatCurrency, formatLocation).
 * 3. Mappers must not import other Mappers (Mapper-to-Mapper dependencies prohibited).
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

const scanRoots = [
  path.join(repoRoot, 'core', 'src', 'adapters', 'outbound', 'database'),
  path.join(repoRoot, 'core', 'src', 'domains'),
  path.join(repoRoot, 'apps', 'mobile', 'src', 'features')
];

const EXCLUDED_DIRS = new Set(['node_modules', 'dist', '.next', 'coverage', '__tests__', '__mocks__']);
const FILE_PATTERN = /\.(ts|tsx)$/;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (FILE_PATTERN.test(entry.name) && !/\.(test|spec)\./.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const FORBIDDEN_PRESENTATION_PROPERTIES = new Set([
  'formattedprice',
  'displaylocation',
  'timeago',
  'formatteddate',
  'relativetime'
]);

const FORBIDDEN_FORMATTER_CALLS = new Set([
  'formatprice',
  'formatdate',
  'formatcurrency',
  'formatlocation',
  'formatrelativetime',
  'formatstablenumber'
]);

function scanRepositoryFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  const violations = [];

  function visit(node) {
    // 1. Check Object Literal properties in repository return/yield
    if (ts.isPropertyAssignment(node)) {
      const propName = node.name.getText(sourceFile).toLowerCase();
      if (FORBIDDEN_PRESENTATION_PROPERTIES.has(propName)) {
        const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        violations.push({
          file: path.relative(repoRoot, filePath).replaceAll(path.sep, '/'),
          line: pos.line + 1,
          type: 'forbidden-presentation-property',
          message: `Repository constructs presentation property '${node.name.getText(sourceFile)}'`
        });
      }
    }

    // 2. Check presentation formatter function calls
    if (ts.isCallExpression(node)) {
      const fnName = node.expression.getText(sourceFile).toLowerCase();
      if (FORBIDDEN_FORMATTER_CALLS.has(fnName)) {
        const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        violations.push({
          file: path.relative(repoRoot, filePath).replaceAll(path.sep, '/'),
          line: pos.line + 1,
          type: 'forbidden-presentation-formatter',
          message: `Repository calls presentation formatter '${node.expression.getText(sourceFile)}()'`
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

function scanMapperFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  const violations = [];

  function visit(node) {
    if (ts.isImportDeclaration(node)) {
      const importPath = node.moduleSpecifier.getText(sourceFile).replace(/['"]/g, '');
      if (/Mapper/i.test(importPath) && !/errorMapper/i.test(importPath)) {
        const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        violations.push({
          file: path.relative(repoRoot, filePath).replaceAll(path.sep, '/'),
          line: pos.line + 1,
          type: 'mapper-to-mapper-dependency',
          message: `Mapper imports another mapper '${importPath}' (Mapper-to-Mapper dependency prohibited)`
        });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

function runAudit(targetRoots = scanRoots) {
  const allFiles = targetRoots.flatMap(r => walk(r));
  const repoFiles = allFiles.filter(f => /Repository/i.test(path.basename(f)) && !/Port\.ts|I[A-Z]\w+Repository\.ts/.test(path.basename(f)));
  const mapperFiles = allFiles.filter(f => /Mapper/i.test(path.basename(f)));

  const repoViolations = repoFiles.flatMap(f => scanRepositoryFile(f));
  const mapperViolations = mapperFiles.flatMap(f => scanMapperFile(f));

  return [...repoViolations, ...mapperViolations];
}

if (require.main === module) {
  const violations = runAudit();

  console.log(`mapper-ownership-guard: scanned repository & mapper files across monorepo.`);

  if (violations.length > 0) {
    console.error(`❌ mapper-ownership-guard: failed. Found ${violations.length} violations:`);
    violations.forEach(v => {
      console.error(`  • ${v.file}:${v.line} [${v.type}] -> ${v.message}`);
    });
    process.exit(1);
  }

  console.log('✅ mapper-ownership-guard: passed (0 presentation leaks, 0 mapper-to-mapper dependencies).');
  process.exit(0);
}

module.exports = { runAudit, scanRepositoryFile, scanMapperFile };
