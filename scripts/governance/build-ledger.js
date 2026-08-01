const fs = require('fs');
const path = require('path');
const { loadAllEvidence, loadAllWaivers, loadAllPhases, loadAllCommits } = require('./load-evidence');

const GOVERNANCE_DIR = path.join(process.cwd(), 'governance');

function generateLedger(writeToDisk = true) {
  const evidenceList = loadAllEvidence().sort((a, b) => a.id.localeCompare(b.id));
  const waiverList = loadAllWaivers().sort((a, b) => a.id.localeCompare(b.id));
  const phases = loadAllPhases();
  const commits = loadAllCommits();

  const phase1 = phases.find(p => p.id === 'phase-1');
  
  let md = `<!-- 
AUTO-GENERATED.
Source of truth: governance/
Do not edit manually.
-->

# Esparex Platform — Implementation Execution Ledger

- **Governing Document:** [Architecture Constitution v1.0.0-FINAL](../esparex_architecture_report.md)
- **Governance Framework Version:** \`GV-1.1\`
- **Evidence Schema Version:** \`EV-1.0\`
- **Current Active Milestone:** \`${phase1.title}\`
- **Execution Status:** \`${phase1.status}\`

> **Note:** This ledger is auto-generated from structured JSON data in the \`governance/\` directory. Do not manually edit this file.

---

## Commit Breakdown & Git Traceability Ledger

| Commit # | Scope & Governing ADRs | Deliverables | Verification Commands | Git Traceability (Branch / PR / SHA / Rollback) | Progress Status |
|:---:|---|---|---|---|:---:|
`;

  const commitData = phase1.commits.map(cid => commits.find(c => c.id === cid));
  commitData.forEach((c, index) => {
    md += `| **Commit ${index + 1}** | \`${c.title}\`<br>Governed by: ${c.governingAdrs.join(', ')} | ${c.deliverables} | ${c.verificationCommands.map(cmd => `\`${cmd}\``).join('<br>')} | Branch: \`${c.branch}\`<br>PR: \`${c.pr}\`<br>SHA: \`${c.sha}\`<br>Rollback: \`${c.rollbackSha}\` | ${c.status === 'VERIFIED' ? '✅ **VERIFIED**' : '⏳ **PLANNED**'} |\n`;
  });

  md += `
---

## Detailed Verification Evidence Audit Table

> **Verification State:** Derived exclusively from evidence gates.
> **Quality Score:** Informational only.

| Evidence ID | Category | Target Verification | Produced By | Approved By | Lifecycle Status | Git SHA | SHA-256 Log Digest | Hash Verification | Size / Format | Storage Backend & URI | Timestamps (Completed / Approved) | Tool Version | Runner / OS | Result | Log Reference |
|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|:---:|---|---|:---:|---|
`;

  evidenceList.forEach(e => {
    md += `| **${e.id}** | ${e.category} | ${e.targetVerification} | ${e.producedBy} | ${e.approvedBy} | \`${e.lifecycleStatus}\` | \`${e.gitSha}\` | \`${e.logDigest}\` | ${e.hashVerification === 'PASS' ? '✅ PASS' : e.hashVerification === 'WAIVED' ? '⚠️ WAIVED' : '❌ FAIL'} | \`${e.sizeFormat}\` | \`${e.storageBackendUri}\` | \`${e.timestamps.completed} / ${e.timestamps.approved}\` | ${e.toolVersion} | ${e.runnerOs} | ${e.result === 'PASS' ? '✅ PASS' : e.result === 'WAIVED' ? '⚠️ WAIVED' : e.result} | \`${e.logReference}\` |\n`;
  });

  md += `
---

## Active Waivers

> **Governance Rule:** WAIVED is considered equivalent to PASS for milestone progression until waiver expiry.

| Waiver ID | Status | Expires | Owner | Reason | Affects | Approved By | Review Date | Severity |
|---|:---:|---|---|---|---|---|---|:---:|
`;

  waiverList.forEach(w => {
    md += `| **${w.id}** | \`${w.status}\` | ${w.expires} | ${w.owner} | ${w.reason} | ${w.affects.join(', ')} | ${w.approvedBy} | ${w.reviewDate} | ${w.severity} |\n`;
  });

  if (writeToDisk) {
    fs.writeFileSync(path.join(GOVERNANCE_DIR, 'IMPLEMENTATION_PROGRESS.md'), md);
    console.log('Successfully generated IMPLEMENTATION_PROGRESS.md');
  }
  return md;
}

if (require.main === module) {
  generateLedger();
}

module.exports = { generateLedger };
