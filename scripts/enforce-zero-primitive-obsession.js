#!/usr/bin/env node

/**
 * 🛡️  Esparex Architectural Guard: Zero Primitive Obsession
 *
 * Enforces that exported application services, custom hooks, and context actions
 * do not take excessive loose primitive parameter lists (>3 primitives).
 *
 * Legitimate Exceptions:
 * - Mathematical / geospatial formulas (e.g. coordinates lat/lon)
 * - Internal non-exported helper functions
 * - Functions accepting typed DTOs / Options objects
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const baselinePath = path.join(repoRoot, 'scripts', 'policy', 'primitive-obsession-baseline.json');

const scanRoots = [
  path.join(repoRoot, 'core', 'src', 'domains'),
  path.join(repoRoot, 'apps', 'web', 'src', 'hooks'),
  path.join(repoRoot, 'apps', 'admin', 'src', 'hooks'),
  path.join(repoRoot, 'apps', 'mobile', 'src', 'hooks'),
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

const primitiveTypes = new Set(['string', 'number', 'boolean', 'bigint', 'symbol']);

function isPrimitiveType(typeNode, sourceFile) {
  if (!typeNode) return false;
  const text = typeNode.getText(sourceFile).trim();
  const clean = text.replace(/ \| (undefined|null)/g, '').replace(/\b(undefined|null) \| /g, '').trim();
  if (primitiveTypes.has(clean)) return true;
  if (/^('[^']+'(\s*\|\s*'[^']+')*)$/.test(clean)) return true;
  if (/^(string|number|boolean)$/.test(clean)) return true;
  return false;
}

function isMathOrGeospatial(fnName, node, sourceFile) {
  const name = (fnName || '').toLowerCase();
  if (/^(calculatedistance|haversine|geodistance|calculatebbox|deg2rad|rad2deg|interpolate|distance)/i.test(name)) {
    return true;
  }
  if (node.parameters && node.parameters.length >= 4) {
    const pNames = node.parameters.map(p => p.name.getText(sourceFile).toLowerCase());
    if (pNames.some(p => p.includes('lat')) && pNames.some(p => p.includes('lon') || pNames.some(p => p.includes('lng')))) {
      return true;
    }
  }
  return false;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  const violations = [];

  function checkFunction(node, fnName, isExported, className = null) {
    if (!isExported) return;

    if (node.parameters && node.parameters.length > 3) {
      let primitiveCount = 0;
      node.parameters.forEach(p => {
        if (p.type && isPrimitiveType(p.type, sourceFile)) {
          primitiveCount++;
        }
      });

      if (primitiveCount > 3) {
        if (isMathOrGeospatial(fnName, node, sourceFile)) {
          return; // Exempt legitimate math
        }

        const qualifiedName = className ? `${className}.${fnName}` : fnName;
        const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        violations.push({
          file: path.relative(repoRoot, filePath).replaceAll(path.sep, '/'),
          line: pos.line + 1,
          fnName: qualifiedName,
          primitiveCount,
          paramCount: node.parameters.length,
          params: node.parameters.map(p => p.getText(sourceFile)).join(', ')
        });
      }
    }
  }

  function visit(node) {
    if (ts.isFunctionDeclaration(node)) {
      const isExported = node.modifiers && node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
      const fnName = node.name ? node.name.getText(sourceFile) : '(anonymous)';
      checkFunction(node, fnName, isExported);
    } else if (ts.isVariableStatement(node)) {
      const isExported = node.modifiers && node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
      if (isExported && node.declarationList) {
        node.declarationList.declarations.forEach(decl => {
          if (decl.initializer && (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))) {
            const fnName = decl.name.getText(sourceFile);
            checkFunction(decl.initializer, fnName, true);
          }
        });
      }
    } else if (ts.isClassDeclaration(node)) {
      const isClassExported = node.modifiers && node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
      const className = node.name ? node.name.getText(sourceFile) : '(anonymous class)';
      if (isClassExported) {
        node.members.forEach(member => {
          if (ts.isMethodDeclaration(member)) {
            const isPrivate = member.modifiers && member.modifiers.some(m => 
              m.kind === ts.SyntaxKind.PrivateKeyword || m.kind === ts.SyntaxKind.ProtectedKeyword
            );
            const fnName = member.name.getText(sourceFile);
            if (!isPrivate && !fnName.startsWith('_')) {
              checkFunction(member, fnName, true, className);
            }
          }
        });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

function runAudit(targetRoots = scanRoots) {
  const files = targetRoots.flatMap(r => walk(r));
  const allViolations = files.flatMap(f => scanFile(f));
  return allViolations;
}

if (require.main === module) {
  const violations = runAudit();
  let baseline = [];
  if (fs.existsSync(baselinePath)) {
    try {
      baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    } catch {
      baseline = [];
    }
  }

  const baselineKeys = new Set(baseline.map(b => `${b.file}:${b.fnName}`));
  const newViolations = violations.filter(v => !baselineKeys.has(`${v.file}:${v.fnName}`));

  console.log('primitive-obsession-guard: total violations in scope = ' + violations.length + ', tracked baseline = ' + baseline.length);

  if (newViolations.length > 0) {
    console.error('❌ primitive-obsession-guard: failed. Found ' + newViolations.length + ' new primitive obsession violations:');
    newViolations.forEach(v => {
      console.error(`  • ${v.file}:${v.line} ${v.fnName} (${v.primitiveCount} primitives) -> params: ${v.params}`);
    });
    process.exit(1);
  }

  console.log('✅ primitive-obsession-guard: passed (0 new violations).');
  process.exit(0);
}

module.exports = { runAudit, scanFile };
