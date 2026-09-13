#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { runStandalone, ROOT } = require('../shared');

const META = { id: 'SSOT-001', name: 'SSOT & Canonical Ownership', version: '2.0.0', category: 'Architecture' };

function run(val) {
  // 1. Dynamic Canonical Symbol Discovery from Package Boundaries
  // Scans packages/*, shared/, core/ for exported symbols to dynamically determine canonical ownership
  const PACKAGE_DIRS = [
    { dir: 'packages/ui', name: '@esparex/ui' },
    { dir: 'packages/contracts', name: '@esparex/contracts' },
    { dir: 'shared', name: '@esparex/shared' },
    { dir: 'core', name: '@esparex/core' },
  ];

  const canonicalSymbolMap = new Map(); // symbol -> packageName

  function scanExports(dir, packageName) {
    const fullDir = path.join(ROOT, dir);
    if (!fs.existsSync(fullDir)) return;

    function getFiles(current) {
      let results = [];
      const list = fs.readdirSync(current);
      for (const item of list) {
        const p = path.join(current, item);
        const stat = fs.statSync(p);
        if (stat.isDirectory()) {
          if (item !== 'node_modules' && item !== 'dist' && !item.startsWith('.')) {
            results = results.concat(getFiles(p));
          }
        } else if (/\.(ts|tsx)$/.test(item) && !item.endsWith('.d.ts')) {
          results.push(p);
        }
      }
      return results;
    }

    const files = getFiles(fullDir);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const matches = content.matchAll(/^export\s+(?:const|function|class|interface|type|enum)\s+(\w+)/gm);
      for (const m of matches) {
        const symbol = m[1];
        if (!canonicalSymbolMap.has(symbol)) {
          canonicalSymbolMap.set(symbol, packageName);
        }
      }
    }
  }

  for (const pkg of PACKAGE_DIRS) {
    scanExports(pkg.dir, pkg.name);
  }

  // 2. Import & Ownership Analysis in Applications (apps/web, apps/admin)
  const appDirs = ['apps/web/src', 'apps/admin/src'];
  for (const appDir of appDirs) {
    const fullDir = path.join(ROOT, appDir);
    if (!fs.existsSync(fullDir)) continue;

    function checkAppFiles(current) {
      const list = fs.readdirSync(current);
      for (const item of list) {
        const p = path.join(current, item);
        const stat = fs.statSync(p);
        if (stat.isDirectory()) {
          if (item !== 'node_modules' && item !== '.next' && !item.startsWith('.')) {
            checkAppFiles(p);
          }
        } else if (/\.(ts|tsx)$/.test(item) && !item.endsWith('.d.ts')) {
          const content = fs.readFileSync(p, 'utf-8');
          const relPath = path.relative(ROOT, p);

          // Rule A: Verify imports — reject deep imports from dist
          const importMatches = content.matchAll(/from\s+['"](@esparex\/[^'"]+)['"]/g);
          for (const match of importMatches) {
            if (match[1].includes('/dist/')) {
              val.error(`Deep Import Violation: ${relPath} imports "${match[1]}". Import from package root instead.`);
            }
          }

          // Rule C: Prohibit application-local icon registry (Icons SSOT is @esparex/ui)
          if (relPath.includes('/icons/IconRegistry') || /\/src\/icons\//.test(relPath)) {
            val.error(`Icon SSOT Violation: ${relPath} detected. Icons must be imported from @esparex/ui.`);
          }

          // Rule D: Location Display SSOT Guard — Ban local locationLabels / formatters in apps
          if (relPath.includes('locationLabels') || (relPath.includes('/location/') && /formatLocation\.(ts|tsx)$/.test(relPath))) {
            val.error(`Location SSOT Violation: ${relPath} detected. Location display formatting must be consumed from @esparex/shared.`);
          }

          // Rule B: Dynamic Canonical Ownership & Import Resolution
          // Check if app file exports a local symbol that collides with a canonical package symbol
          const localExports = content.matchAll(/^export\s+(?:const|function|class|interface|type|enum)\s+(\w+)/gm);
          for (const exp of localExports) {
            const sym = exp[1];
            if (canonicalSymbolMap.has(sym)) {
              const canonicalOwner = canonicalSymbolMap.get(sym);
              // Allow local wrapper if file explicitly imports canonical symbol or contract/shared package, or is in page/route entry point, or if app is admin decoupled from backend core
              const importsCanonical =
                content.includes(`from "${canonicalOwner}"`) ||
                content.includes(`from '${canonicalOwner}'`) ||
                content.includes(`from "@esparex/contracts"`) ||
                content.includes(`from '@esparex/contracts'`) ||
                content.includes(`from "@esparex/shared"`) ||
                content.includes(`from '@esparex/shared'`) ||
                (relPath.startsWith('apps/admin/') && canonicalOwner === '@esparex/core');

              if (!importsCanonical && !relPath.includes('/app/') && !relPath.includes('/pages/')) {
                val.error(`Canonical Ownership Violation: "${sym}" in ${relPath} re-declares a canonical symbol owned by ${canonicalOwner}. Import from ${canonicalOwner} instead of declaring a local copy.`);
              }
            }
          }
        }
      }
    }
    checkAppFiles(fullDir);
  }

  // 3. Structural Directory & Legacy Namespace Enforcement
  const PROHIBITED_DIRECTORIES = [
    {
      dir: 'backend/api/src/models',
      reason: 'Backend Model Violation: backend/api/src/models is prohibited. Canonical Mongoose models belong in @esparex/core.',
    },
    {
      dir: 'core/src/domain',
      reason: 'Domain Entity Placement Violation: core/src/domain is prohibited. Domain entities and value objects must reside inside bounded contexts under core/src/domains/<context>/domain/.',
    },
    {
      dir: 'shared/src/contracts',
      reason: 'Shared Directory Naming Violation: shared/src/contracts is prohibited. Wire DTO contracts belong in @esparex/contracts and route path constants belong in shared/src/routes/.',
    },
    {
      dir: 'core/src/services/notification',
      reason: 'Deprecated Namespace Violation: core/src/services/notification is prohibited. Notification services belong in core/src/domains/notifications/.',
    },
    {
      dir: '.agents/workflows',
      reason: 'Workflow Directory Ambiguity: .agents/workflows (plural) is prohibited. Canonical workflow documentation belongs in .agents/workflow/.',
    },
  ];

  for (const item of PROHIBITED_DIRECTORIES) {
    const fullPath = path.join(ROOT, item.dir);
    if (fs.existsSync(fullPath)) {
      val.error(item.reason);
    }
  }

  // 4. Legacy Core Services and Models Ratchet (ADR-008 DDD Migration)
  const CORE_SERVICES_DIR = path.join(ROOT, 'core/src/services');
  const CORE_MODELS_DIR = path.join(ROOT, 'core/src/models');
  const MAX_SERVICES_COUNT = 121;
  const MAX_MODELS_COUNT = 64;

  function countSourceFiles(dir) {
    if (!fs.existsSync(dir)) return 0;
    let count = 0;
    function walk(d) {
      for (const item of fs.readdirSync(d)) {
        const p = path.join(d, item);
        const stat = fs.statSync(p);
        if (stat.isDirectory()) {
          if (item !== 'node_modules' && !item.startsWith('.')) walk(p);
        } else if (/\.(ts|tsx)$/.test(item) && !item.endsWith('.d.ts')) {
          count++;
        }
      }
    }
    walk(dir);
    return count;
  }

  const currentServicesCount = countSourceFiles(CORE_SERVICES_DIR);
  if (currentServicesCount > MAX_SERVICES_COUNT) {
    val.error(`DDD Migration Violation: core/src/services contains ${currentServicesCount} files (max allowed: ${MAX_SERVICES_COUNT}). New services must be created within their bounded context under core/src/domains/<context>/ per ADR-008.`);
  }

  const currentModelsCount = countSourceFiles(CORE_MODELS_DIR);
  if (currentModelsCount > MAX_MODELS_COUNT) {
    val.error(`DDD Migration Violation: core/src/models contains ${currentModelsCount} files (max allowed: ${MAX_MODELS_COUNT}). New models must be created as repository adapters in core/src/adapters/outbound/persistence/ per ADR-008 Sprint 3.`);
  }

  val.info('Dynamic canonical ownership, structural directory boundaries, and DDD migration ratchets verified');
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
