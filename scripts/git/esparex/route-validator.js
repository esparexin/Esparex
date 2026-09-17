#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { runStandalone, ROOT } = require('../shared');

const META = { id: 'ROUTE-001', name: 'Route Validation', version: '1.0.0', category: 'API' };

function run(val) {
  const changedFiles = (() => {
    try {
      const out = execSync('git diff --cached --name-only --diff-filter=ACMR', { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      return out.split('\n').filter(Boolean);
    } catch { return []; }
  })();

  const routeFiles = changedFiles.filter(f =>
    (f.endsWith('.ts') || f.endsWith('.js')) &&
    (f.includes('/routes/') || f.includes('/router') || f.endsWith('-routes.ts') || f.endsWith('.route.ts'))
  );

  if (routeFiles.length === 0) return;

  const routes = new Map();
  for (const file of routeFiles) {
    const fullPath = path.join(ROOT, file);
    if (!fs.existsSync(fullPath)) continue;
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
            val.error(`Duplicate route "${key}" in ${file} and ${routes.get(key)}`);
          } else {
            routes.set(key, file);
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
      const hasRedirect = content.includes('redirect(');
      const hasJsx = /return\s*\(?\s*</.test(content) || /<[A-Z][A-Za-z0-9]*\b/.test(content);
      if (hasRedirect && !hasJsx) {
        val.error(
          `Redirect-Only Page Violation: ${relPath} is a pure redirect stub. Move this redirect to next.config.mjs redirects() instead of creating a Next.js page.`
        );
      }
    } catch { /* ignore */ }
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
