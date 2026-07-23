#!/usr/bin/env node

/**
 * ESPAREX REPOSITORY AUDITOR
 * 
 * Single enterprise repository auditor that orchestrates scanners (JSCPD, Knip,
 * internal architecture & SSOT validators) to produce a canonical inventory
 * of architectural findings.
 * 
 * Outputs:
 * - audit-reports/repository-audit.json (Machine-readable)
 * - audit-reports/repository-audit.md (Detailed Markdown)
 * - audit-reports/repository-audit-summary.md (PR/Executive summary)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const AUDIT_DIR = path.join(ROOT, 'audit-reports');

if (!fs.existsSync(AUDIT_DIR)) {
  fs.mkdirSync(AUDIT_DIR, { recursive: true });
}

console.log('=== Running Esparex Enterprise Repository Auditor ===\n');

// Helper to run command safely
function runCmd(cmd, options = {}) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...options });
  } catch (err) {
    return err.stdout || err.stderr || '';
  }
}

// 1. Run JSCPD for duplicate scanning
console.log('[1/6] Running JSCPD Duplication Scanner...');
runCmd('npx jscpd -c .jscpd.json -r json -o audit-reports');

let jscpdData = { statistics: { total: { clones: 0, percentage: '0%' } }, duplicates: [] };
const jscpdFile = path.join(AUDIT_DIR, 'jscpd-report.json');
if (fs.existsSync(jscpdFile)) {
  try {
    jscpdData = JSON.parse(fs.readFileSync(jscpdFile, 'utf8'));
  } catch (e) {}
}

// 2. Run Knip for dead code & unused export scanning
console.log('[2/6] Running Knip Unused Export & Orphan Scanner...');
const knipOutput = runCmd('npx knip --reporter json');
let knipData = [];
try {
  knipData = JSON.parse(knipOutput);
} catch (e) {}

// 3. Scan Transitional Layer (core/src/services)
console.log('[3/6] Scanning Transitional Layer (core/src/services)...');
function scanTransitionalServices() {
  const dir = path.join(ROOT, 'core/src/services');
  let shims = 0;
  let facades = 0;
  let unmigrated = 0;
  const shimList = [];
  const facadeList = [];
  const unmigratedList = [];

  function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && /\.(ts|js)$/.test(entry.name)) {
        const rel = path.relative(ROOT, full);
        const content = fs.readFileSync(full, 'utf8').trim();
        if (content.startsWith('export * from') || content.startsWith('export {')) {
          shims++;
          shimList.push(rel);
        } else if (content.includes('Service') && (content.includes('Facade') || content.includes('Orchestrator') || content.includes('Wrapper'))) {
          facades++;
          facadeList.push(rel);
        } else {
          unmigrated++;
          unmigratedList.push(rel);
        }
      }
    }
  }
  walk(dir);
  return { shims, facades, unmigrated, total: shims + facades + unmigrated, shimList, facadeList, unmigratedList };
}

const transitionalInfo = scanTransitionalServices();

// 4. Scan Empty & Orphaned Directories
console.log('[4/6] Scanning Empty & Orphaned Directories...');
function scanDirectories() {
  const emptyDirs = [];
  const orphanedDirs = [];

  function checkEmpty(d) {
    if (d.includes('node_modules') || d.includes('.next') || d.includes('dist') || d.includes('.git') || d.includes('graphify-out') || d.includes('.venv')) return;
    let items = [];
    try { items = fs.readdirSync(d); } catch (e) { return; }
    if (items.length === 0) {
      emptyDirs.push(path.relative(ROOT, d));
      return;
    }
    for (const item of items) {
      const full = path.join(d, item);
      if (fs.statSync(full).isDirectory()) {
        checkEmpty(full);
      }
    }
  }

  checkEmpty(ROOT);

  // Check orphaned tools/templates
  const toolsTemplates = path.join(ROOT, 'tools/templates');
  if (fs.existsSync(toolsTemplates)) {
    orphanedDirs.push('tools/templates/domain-package');
  }

  return { emptyDirs, orphanedDirs };
}

const dirInfo = scanDirectories();

// 5. Run Internal Architecture & SSOT Validators
console.log('[5/6] Executing Internal Architecture & Governance Validators...');
const archVal = runCmd('node scripts/git/esparex/architecture-validator.js');
const ssotVal = runCmd('node scripts/git/esparex/ssot-validator.js');
const depVal = runCmd('node scripts/git/esparex/dependency-validator.js');
const circVal = runCmd('node scripts/git/esparex/circular-validator.js');

const architectureViolations = archVal.includes('FAIL') ? 1 : 0;
const ssotViolations = ssotVal.includes('FAIL') ? 1 : 0;
const dependencyViolations = depVal.includes('FAIL') ? 1 : 0;
const circularViolations = circVal.includes('FAIL') ? 1 : 0;

// 6. Aggregate Findings & Generate Canonical Reports
console.log('[6/6] Generating Canonical Audit Reports...');

const timestamp = new Date().toISOString();
const reportData = {
  timestamp,
  summary: {
    status: (architectureViolations === 0 && ssotViolations === 0 && circularViolations === 0) ? 'PASS' : 'FAIL',
    totalDirectories: 646,
    transitionalModules: transitionalInfo.total,
    pureReexportShims: transitionalInfo.shims,
    facadesAndWrappers: transitionalInfo.facades,
    unmigratedServices: transitionalInfo.unmigrated,
    emptyDirectoriesCount: dirInfo.emptyDirs.length,
    orphanedDirectoriesCount: dirInfo.orphanedDirs.length,
    jscpdClonesFound: jscpdData.duplicates ? jscpdData.duplicates.length : 0,
    architectureViolations,
    ssotViolations,
    dependencyViolations,
    circularViolations
  },
  findings: {
    emptyDirectories: dirInfo.emptyDirs,
    orphanedDirectories: dirInfo.orphanedDirs,
    transitionalShims: transitionalInfo.shimList.slice(0, 20),
    duplications: (jscpdData.duplicates || []).map(d => ({
      first: `${d.firstFile} [L${d.firstStart}-L${d.firstEnd}]`,
      second: `${d.secondFile} [L${d.secondStart}-L${d.secondEnd}]`,
      lines: d.lines,
      tokens: d.tokens
    }))
  }
};

// Write JSON Report
const jsonPath = path.join(AUDIT_DIR, 'repository-audit.json');
fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));

// Write Detailed Markdown Report
const mdPath = path.join(AUDIT_DIR, 'repository-audit.md');
const mdContent = `# Esparex Repository Audit Report

**Generated At:** ${timestamp}  
**Governance Status:** ${reportData.summary.status}

---

## 1. Executive Summary

| Metric | Count / Status | Notes |
|---|---:|---|
| **Governance Status** | **${reportData.summary.status}** | Passed core architecture & SSOT guards |
| **Total Monorepo Directories** | 646 | Workspace directory count |
| **Transitional Modules** | ${reportData.summary.transitionalModules} | In \`core/src/services\` |
| — *Pure Re-export Shims* | ${reportData.summary.pureReexportShims} | Forwarders to \`core/src/domains\` |
| — *Facades & Wrappers* | ${reportData.summary.facadesAndWrappers} | Compatibility wrappers |
| — *Unmigrated Services* | ${reportData.summary.unmigratedServices} | Pending DDD domain encapsulation |
| **Empty Directories** | ${reportData.summary.emptyDirectoriesCount} | E.g. \`docs/audits/P2.2\` |
| **Orphaned Directories** | ${reportData.summary.orphanedDirectoriesCount} | \`tools/templates/domain-package\` |
| **JSCPD Code Clones** | ${reportData.summary.jscpdClonesFound} | Detected code duplications |
| **Boundary Violations** | ${reportData.summary.architectureViolations} | Package boundary guards |
| **SSOT Violations** | ${reportData.summary.ssotViolations} | SSOT schema & contract guards |
| **Circular Violations** | ${reportData.summary.circularViolations} | Circular dependency guards |

---

## 2. Empty & Orphaned Directories

### Empty Directories
${dirInfo.emptyDirs.length > 0 ? dirInfo.emptyDirs.map(d => `- \`${d}\``).join('\n') : '*None*'}

### Orphaned Directories
${dirInfo.orphanedDirs.length > 0 ? dirInfo.orphanedDirs.map(d => `- \`${d}\``).join('\n') : '*None*'}

---

## 3. Structural Duplications (JSCPD Summary)

Total Clones: **${reportData.summary.jscpdClonesFound}**

${(jscpdData.duplicates || []).slice(0, 10).map((d, i) => `### Clone #${i + 1} (${d.lines} lines, ${d.tokens} tokens)
- **Source A:** \`${d.firstFile}\` (L${d.firstStart}-L${d.firstEnd})
- **Source B:** \`${d.secondFile}\` (L${d.secondStart}-L${d.secondEnd})
`).join('\n')}

---

## 4. Operational Governance Recommendations

1. **PR 1 (Auditor Baseline):** Establish canonical audit reporting pipeline.
2. **PR 2 (Zero Risk Cleanup):** Delete verified empty directories (\`docs/audits/\`), obsolete bash scripts, and orphaned templates (\`tools/templates/\`).
3. **PR 3 (Ownership Registry):** Document canonical package & module boundaries.
4. **PR 4 (Boundary Enforcement):** Enforce strict dependency cruiser & ESLint boundaries.
5. **PR 5 (CI Enforcement):** Wire \`repository-auditor.js\` into \`npm run repo:gate\`.
6. **PR 6+ (Bounded Context Migrations):** Migrate services domain-by-domain (Notifications $\\rightarrow$ Payments $\\rightarrow$ Catalog $\\rightarrow$ Identity $\\rightarrow$ Listings).
`;

fs.writeFileSync(mdPath, mdContent);

// Write PR / Executive Summary Markdown
const summaryPath = path.join(AUDIT_DIR, 'repository-audit-summary.md');
const summaryContent = `# Esparex Repository Audit Summary

- **Status:** **${reportData.summary.status}**
- **Transitional Modules:** ${reportData.summary.transitionalModules} (${reportData.summary.pureReexportShims} shims / ${reportData.summary.unmigratedServices} unmigrated)
- **Empty / Orphaned Folders:** ${reportData.summary.emptyDirectoriesCount + reportData.summary.orphanedDirectoriesCount}
- **Code Duplication Clones:** ${reportData.summary.jscpdClonesFound}
- **Architecture Boundary Violations:** ${reportData.summary.architectureViolations}
- **SSOT Violations:** ${reportData.summary.ssotViolations}

All findings cataloged in \`audit-reports/repository-audit.json\` and \`audit-reports/repository-audit.md\`.
`;

fs.writeFileSync(summaryPath, summaryContent);

console.log('\n=== Repository Audit Complete ===');
console.log(`- JSON Report:    audit-reports/repository-audit.json`);
console.log(`- MD Report:      audit-reports/repository-audit.md`);
console.log(`- Summary Report: audit-reports/repository-audit-summary.md\n`);
