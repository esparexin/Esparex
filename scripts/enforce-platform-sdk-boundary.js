#!/usr/bin/env node

/**
 * 🛡️  Esparex Architectural Guard: Platform / Native SDK Boundary
 *
 * Enforces that native device SDKs (expo-image-picker, expo-camera, expo-notifications, expo-location)
 * and 3rd-party platform SDKs (AWS, Firebase, Razorpay) are strictly isolated to infrastructure adapters
 * and never imported directly inside presentation, domain, or application layers.
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

const scanRoots = [
  path.join(repoRoot, 'apps', 'mobile', 'src', 'features'),
  path.join(repoRoot, 'core', 'src', 'domains')
];

const EXCLUDED_DIRS = new Set(['node_modules', 'dist', '.next', 'coverage', '__tests__', '__mocks__', 'infrastructure', 'adapters']);
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

const FORBIDDEN_SDK_MODULES = [
  'expo-image-picker',
  'expo-camera',
  'expo-notifications',
  'expo-location',
  '@aws-sdk',
  'firebase-admin'
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  const violations = [];

  function visit(node) {
    if (ts.isImportDeclaration(node)) {
      const importPath = node.moduleSpecifier.getText(sourceFile).replace(/['"]/g, '');
      const matchedSdk = FORBIDDEN_SDK_MODULES.find(sdk => importPath.includes(sdk));
      if (matchedSdk) {
        const isTypeOnly = node.importClause && node.importClause.isTypeOnly;
        if (!isTypeOnly) {
          const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
          violations.push({
            file: path.relative(repoRoot, filePath).replaceAll(path.sep, '/'),
            line: pos.line + 1,
            importPath,
            sdk: matchedSdk
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

function runAudit(targetRoots = scanRoots) {
  const files = targetRoots.flatMap(r => walk(r));
  return files.flatMap(f => scanFile(f));
}

if (require.main === module) {
  const violations = runAudit();

  console.log('platform-sdk-boundary-guard: scanned mobile features & core domains.');

  if (violations.length > 0) {
    console.error(`❌ platform-sdk-boundary-guard: failed. Found ${violations.length} native/platform SDK leaks in non-infrastructure layers:`);
    violations.forEach(v => {
      console.error(`  • ${v.file}:${v.line} -> direct import of '${v.importPath}' (must use infrastructure adapter)`);
    });
    process.exit(1);
  }

  console.log('✅ platform-sdk-boundary-guard: passed (0 platform SDK leaks).');
  process.exit(0);
}

module.exports = { runAudit, scanFile };
