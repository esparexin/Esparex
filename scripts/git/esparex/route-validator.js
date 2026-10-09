#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { runStandalone, ROOT } = require('../shared');

const META = { id: 'ROUTE-001', name: 'Route Validation', version: '1.0.0', category: 'API' };

const ts = require('typescript');

function isRedirectOnlyPage(filePath, content) {
  try {
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
    let hasRedirectCall = false;
    let hasJsx = false;

    function visit(node) {
      if (ts.isCallExpression(node)) {
        const text = node.expression.getText(sourceFile);
        if (text === 'redirect' || text.endsWith('.redirect')) {
          hasRedirectCall = true;
        }
      }
      if (
        ts.isJsxElement(node) ||
        ts.isJsxSelfClosingElement(node) ||
        ts.isJsxFragment(node)
      ) {
        hasJsx = true;
      }
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return hasRedirectCall && !hasJsx;
  } catch {
    return false;
  }
}

function run(val) {
  // DECISION-GATE C-4: staged diff in pre-commit, merge-base diff in CI
  // (CI checkouts have no staged index — --cached would be vacuous).
  const { getChangedFiles } = require('./diff-scope');
  const { files: changedFiles, scope } = getChangedFiles(ROOT);

  const routeFiles = changedFiles.filter(f =>
    (f.endsWith('.ts') || f.endsWith('.js')) &&
    (f.includes('/routes/') || f.includes('/router') || f.endsWith('-routes.ts') || f.endsWith('.route.ts'))
  );

  if (routeFiles.length === 0) {
    val.info(`Route validation: no route files in scope (${scope})`);
    return;
  }

  // Duplicate routes are only meaningful within a single router file: different
  // routers mount at different prefixes, so identical literal paths across files
  // are NOT duplicates (cf. P0-3 double-mount — mount-prefix aware checks live
  // in enforce-route-collision-guard.js). A per-file map avoids false positives
  // when the CI merge-base diff touches many routers at once (DECISION-GATE C-4).
  for (const file of routeFiles) {
    const fullPath = path.join(ROOT, file);
    if (!fs.existsSync(fullPath)) continue;
    const routes = new Map();
    const content = fs.readFileSync(fullPath, 'utf-8');
    const routeMatches = content.match(/(?:router|route)\.(?:get|post|put|patch|delete|options)\s*\(\s*['"`](\/[^'"`]*)['"`]/gi);
    if (routeMatches) {
      for (const match of routeMatches) {
        const methodMatch = match.match(/(?:router|route)\.(get|post|put|patch|delete|options)/i);
        const method = methodMatch ? methodMatch[1].toUpperCase() : '';
        const parts = match.split(/['"`]/);
        if (parts.length >= 2) {
          const routePath = parts[1];
          const key = `${method} ${routePath}`;
          if (routes.has(key)) {
            val.error(`Duplicate route "${key}" registered twice in ${file} (first at line ${routes.get(key)})`);
          } else {
            const lineNo = content.slice(0, content.indexOf(match)).split('\n').length;
            routes.set(key, lineNo);
          }
        }
      }
    }
  }

  // 2. Next.js App Router: Detect and reject redirect-only page.tsx stubs
  // Redirects belong in next.config.mjs redirects() rather than physical page components
  function scanAppPages(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      if (item.name === 'node_modules' || item.name === '.next') continue;
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        scanAppPages(full, out);
      } else if (item.name === 'page.tsx') {
        out.push(full);
      }
    }
    return out;
  }

  // Zero redirect-only pages allowed in Next.js App Router
  const TRANSITIONAL_REDIRECT_PAGES = new Set();

  const appPages = [
    ...scanAppPages(path.join(ROOT, 'apps/web/src/app')),
    ...scanAppPages(path.join(ROOT, 'apps/admin/src/app')),
  ];

  for (const pagePath of appPages) {
    const relPath = path.relative(ROOT, pagePath).replace(/\\/g, '/');
    if (TRANSITIONAL_REDIRECT_PAGES.has(relPath)) continue;
    try {
      const content = fs.readFileSync(pagePath, 'utf-8');
      if (isRedirectOnlyPage(pagePath, content)) {
        val.error(
          `Redirect-Only Page Violation: ${relPath} is a pure redirect stub (AST verified redirect() with 0 JSX elements). Move this redirect to next.config.mjs redirects() instead of creating a physical Next.js page component.`
        );
      }
    } catch { /* ignore */ }
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
