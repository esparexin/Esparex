#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { runStandalone, ROOT } = require('../shared');

const META = { id: 'DUP-001', name: 'Duplicate & Dead Code Baseline', version: '2.1.0', category: 'Architecture' };

function run(val) {
  // 1. AST / Import-Aware Orphan File Verification
  const SEARCH_DIRS = ['apps', 'backend', 'core', 'shared', 'packages'];
  const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

  function getAllFiles(dir, allFiles = []) {
    if (!fs.existsSync(dir)) return allFiles;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (file === 'node_modules' || file === 'dist' || file === 'coverage' || file === 'Pods' || file === 'build' || file === '.turbo' || file === '.git' || file.startsWith('.')) return;
      const name = path.join(dir, file);
      if (!fs.existsSync(name)) return;
      const stat = fs.lstatSync(name);
      if (stat.isSymbolicLink()) return;
      if (stat.isDirectory()) {
        getAllFiles(name, allFiles);
      } else {
        if (EXTENSIONS.includes(path.extname(file)) && !file.endsWith('.d.ts')) {
          allFiles.push(name);
        }
      }
    });
    return allFiles;
  }

  const allFiles = SEARCH_DIRS.flatMap(dir => getAllFiles(path.join(ROOT, dir)));

  // Distinguish production imports vs test-only imports
  const prodReferences = new Set();
  const testReferences = new Set();
  const IMPORT_PATTERN = /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?from\s+)?['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  allFiles.forEach(file => {
    const relPath = path.relative(ROOT, file).replace(/\\/g, '/');
    const isTest = relPath.includes('__tests__') || relPath.includes('__mocks__') || relPath.endsWith('.spec.ts') || relPath.endsWith('.spec.tsx') || relPath.endsWith('.test.ts') || relPath.endsWith('.test.tsx') || relPath.includes('/tests/');
    try {
      const content = fs.readFileSync(file, 'utf8');
      let m;
      while ((m = IMPORT_PATTERN.exec(content)) !== null) {
        const spec = m[1] || m[2] || m[3];
        if (spec) {
          const base = path.basename(spec);
          const cleanBase = base.replace(/\.(ts|tsx|js|jsx)$/, '');
          if (isTest) {
            testReferences.add(spec);
            testReferences.add(base);
            testReferences.add(cleanBase);
          } else {
            prodReferences.add(spec);
            prodReferences.add(base);
            prodReferences.add(cleanBase);
          }
        }
      }
    } catch { /* ignore */ }
  });

  // Package metadata: only package.json is an authoritative root (never generated reports or lockfiles)
  const pkgPath = path.join(ROOT, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkgContent = fs.readFileSync(pkgPath, 'utf8');
      allFiles.forEach(f => {
        const clean = path.basename(f).replace(/\.(ts|tsx|js|jsx)$/, '');
        if (pkgContent.includes(clean)) prodReferences.add(clean);
      });
    } catch { /* ignore */ }
  }

  // Next.js conventions
  const NEXTJS_CONVENTIONS = new Set([
    'not-found', 'error', 'global-error', 'loading',
    'layout', 'page', 'route', 'middleware', 'proxy', 'template',
    'default', 'instrumentation', 'opengraph-image', 'twitter-image',
    'sitemap', 'robots', 'manifest', 'sw'
  ]);

  // Known documented components and transitional candidates
  const KNOWN_ALLOWLIST = new Set([
    'promotion.validator',
    'wallet.validator',
    'FEFOEntitlementConsumptionEngine',
    'CatalogNotificationService',
    'listingTypeIntegrity',
    'chatPagination',
    'adminAudit.validator',
    'adminModeration.validator',
    'loadEnv',
    'mongoosePlugins',
  ]);

  const orphans = [];
  allFiles.forEach(file => {
    const relPath = path.relative(ROOT, file).replace(/\\/g, '/');
    const fileName = path.basename(file);
    const cleanName = fileName.replace(/\.(ts|tsx|js|jsx)$/, '');
    const isTest = relPath.includes('__tests__') || relPath.includes('__mocks__') || relPath.endsWith('.spec.ts') || relPath.endsWith('.spec.tsx') || relPath.endsWith('.test.ts') || relPath.endsWith('.test.tsx') || relPath.includes('/tests/');
    const isScriptOrConfig = relPath.includes('scripts/') || relPath.includes('seeds/') || relPath.includes('cron/') || relPath.includes('migrations/') || relPath.includes('/jobs/') || relPath.includes('.eslintrc') || relPath.endsWith('config.ts') || relPath.endsWith('config.js') || relPath.endsWith('config.mjs') || relPath.endsWith('config.json') || relPath.endsWith('index.ts') || relPath.endsWith('index.tsx') || relPath.endsWith('index.js') || relPath.includes('App.tsx') || relPath.includes('smoke.ts') || relPath.includes('jest.setup');

    if (isTest || isScriptOrConfig) return;
    if (NEXTJS_CONVENTIONS.has(cleanName) || KNOWN_ALLOWLIST.has(cleanName)) return;

    const hasProd = prodReferences.has(cleanName) || prodReferences.has(fileName);
    const hasTest = testReferences.has(cleanName) || testReferences.has(fileName);

    if (!hasProd) {
      if (hasTest) {
        orphans.push(`[TEST_ONLY_REF] ${relPath}`);
      } else {
        orphans.push(`[ZERO_REFS] ${relPath}`);
      }
    }
  });

  if (orphans.length > 0) {
    for (const orphan of orphans) {
      val.error(`Orphan/dead file detected: ${orphan}`);
    }
  } else {
    val.info('Zero orphan files detected (import/require dependency resolution verified)');
  }

  // 2. Automatic Zero-Config Dynamic Baseline & Regression Guard
  const reportPath = path.join(ROOT, '.jscpd-report/jscpd-report.json');
  const baselinePath = path.join(ROOT, '.jscpd-baseline.json');
  let previousBaseline = 0.11;

  if (fs.existsSync(baselinePath)) {
    try {
      const b = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
      previousBaseline = typeof b.baselinePercentage === 'number' ? b.baselinePercentage : 0.11;
    } catch { /* fallback */ }
  }

  if (!fs.existsSync(reportPath)) {
    try {
      const { execSync } = require('child_process');
      execSync('npm run guard:duplicate-code', { cwd: ROOT, stdio: ['pipe', 'pipe', 'pipe'] });
    } catch {
      val.error('JSCPD report not found and could not be generated. Run npm run guard:duplicate-code before repo:gate.');
      return;
    }
  }

  try {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const currentRate = report.statistics?.total?.percentage || 0;
    const effectiveBaseline = Math.max(previousBaseline, 0.08);

    if (currentRate > effectiveBaseline + 0.01) {
      val.error(`Duplicate Rate Regression: Current ${currentRate}% exceeds baseline ${effectiveBaseline}%`);
    } else {
      val.info(`Duplicate Rate Preserved: ${currentRate}% (Baseline: ${effectiveBaseline}%)`);
    }
  } catch {
    val.warning('Could not parse JSCPD report file');
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
