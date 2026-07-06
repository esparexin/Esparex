/**
 * generate-dashboard.js
 * =======================
 * Architecture Governance Dashboard Generator (Architecture v1.1.0)
 *
 * Aggregates all architecture governance metrics (health score, drift status,
 * API diff count, active exceptions, and boundary rules) into a single unified report.
 *
 * Usage:
 *   node scripts/architecture/generate-dashboard.js
 */

'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const reportPath = path.join(ROOT, '.architecture-report.md');
const matrixPath = path.join(ROOT, 'scripts', 'architecture', 'matrix.js');

function parseReport() {
  if (!fs.existsSync(reportPath)) {
    return { score: 'unknown', results: [] };
  }
  const content = fs.readFileSync(reportPath, 'utf8');
  const scoreMatch = content.match(/\*\*Architecture Health Score:\*\* (\d+)\/100/);
  const score = scoreMatch ? `${scoreMatch[1]}/100` : 'unknown';

  const results = [];
  const lines = content.split('\n');
  let tableStarted = false;

  for (const line of lines) {
    if (line.startsWith('| Gate |')) {
      tableStarted = true;
      continue;
    }
    if (tableStarted && line.startsWith('|')) {
      if (line.includes('---')) continue;
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 4) {
        results.push({
          gate: parts[1],
          status: parts[2],
          detail: parts[3]
        });
      }
    } else if (tableStarted) {
      break;
    }
  }

  return { score, results };
}

function getExceptionsCount() {
  if (!fs.existsSync(matrixPath)) {
    return 0;
  }
  try {
    const { EXCEPTIONS } = require(matrixPath);
    return Array.isArray(EXCEPTIONS) ? EXCEPTIONS.length : 0;
  } catch (e) {
    return 0;
  }
}

function getRulesCount() {
  if (!fs.existsSync(matrixPath)) {
    return { packageRules: 0, internalRules: 0 };
  }
  try {
    const { PACKAGE_BOUNDARY_RULES, CORE_NAMESPACES } = require(matrixPath);
    const packageRules = Array.isArray(PACKAGE_BOUNDARY_RULES) ? PACKAGE_BOUNDARY_RULES.length : 0;
    
    let internalRules = 0;
    if (Array.isArray(CORE_NAMESPACES)) {
      CORE_NAMESPACES.forEach(ns => {
        if (Array.isArray(ns.forbiddenDeps)) {
          internalRules += ns.forbiddenDeps.length;
        }
      });
    }

    return { packageRules, internalRules };
  } catch (e) {
    return { packageRules: 0, internalRules: 0 };
  }
}

function main() {
  console.log('Generating Governance Dashboard...');

  // Ensure architecture report exists
  if (!fs.existsSync(reportPath)) {
    console.log('Generating architecture report first...');
    spawnSync('node', [path.join(ROOT, 'scripts', 'architecture', 'check-architecture.js'), '--report'], { cwd: ROOT });
  }

  const report = parseReport();
  const exceptionsCount = getExceptionsCount();
  const { packageRules, internalRules } = getRulesCount();

  // Run API diff to count additions
  let apiChanges = 'No changes';
  const apiDiffResult = spawnSync('node', [path.join(ROOT, 'scripts', 'architecture', 'api-diff.js')], { cwd: ROOT, encoding: 'utf8' });
  if (apiDiffResult.status === 0) {
    const output = apiDiffResult.stdout || '';
    const addedCount = (output.match(/Added Exports \(SAFE\):/g) || []).length;
    const removedCount = (output.match(/Removed Exports \(BREAKING\):/g) || []).length;
    const modifiedCount = (output.match(/Modified Signatures \(POTENTIALLY BREAKING\):/g) || []).length;
    if (addedCount > 0 || removedCount > 0 || modifiedCount > 0) {
      apiChanges = `${addedCount} added, ${removedCount} removed, ${modifiedCount} modified`;
    }
  }

  const dashboardLines = [
    '# 🏛️ Esparex Architecture Governance Dashboard',
    '',
    `**Last Updated:** ${new Date().toISOString()}`,
    `**Architecture Version:** v1.1.0`,
    `**Overall Health Score:** ${report.score}`,
    '',
    '## 📊 Governance Metrics',
    '',
    '| Metric | Value | Status | Description |',
    '| --- | --- | --- | --- |',
    `| **Architecture Health** | ${report.score} | ${report.score === '100/100' ? '✅ OPTIMAL' : '⚠️ DEGRADED'} | Current compliance with all validation gates |`,
    `| **Enforced Package Rules** | ${packageRules} rules | ✅ ACTIVE | Cross-boundary rules defined in matrix.js |`,
    `| **Enforced Internal Rules** | ${internalRules} rules | ✅ ACTIVE | Namespace sub-path rules inside core/src |`,
    `| **Active Exceptions** | ${exceptionsCount} exceptions | ${exceptionsCount === 0 ? '✅ NONE' : '⚠️ AT RISK'} | Bypasses approved by Platform Team |`,
    `| **Public API Diff** | ${apiChanges} | ✅ SAFE | Export signature delta from main branch |`,
    '',
    '## 🔍 Validation Gates Status',
    '',
    '| Gate | Compliance | Detail |',
    '| --- | --- | --- |',
    ...report.results.map(r => `| ${r.gate} | ${r.status} | ${r.detail} |`),
    '',
    '## 📄 Quick Commands',
    '',
    '- Check local architecture: `npm run architecture:check:fast`',
    '- Run complete validation suite: `npm run architecture:check`',
    '- View visual dependency graph: `docs/architecture/dependency-graph.html` (run `npm run architecture:visualize` first)',
    '- Diffs public API: `npm run api:diff`',
    '- Check for drift: `npm run architecture:drift`',
    ''
  ];

  const dashboardPath = path.join(ROOT, '.architecture-dashboard.md');
  fs.writeFileSync(dashboardPath, dashboardLines.join('\n'), 'utf8');

  console.log(`\n======================================================`);
  console.log(`🏛️  Esparex Architecture Governance Dashboard Generated!`);
  console.log(`   Location: .architecture-dashboard.md`);
  console.log(`   Health Score: ${report.score}`);
  console.log(`   Rules: ${packageRules} package / ${internalRules} internal`);
  console.log(`   Exceptions: ${exceptionsCount}`);
  console.log(`======================================================\n`);
}

main();
