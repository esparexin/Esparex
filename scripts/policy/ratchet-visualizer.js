const fs = require("fs");
const path = require("path");

const BASELINE_PATH = path.resolve(__dirname, "governance-debt-baseline.json");

const INITIAL_RATISTICS = [
  { key: "namingViolations", name: "Naming Conventions", initial: 1 },
  { key: "platformGovernanceViolations", name: "Platform Governance", initial: 1 },
  { key: "adminStatusLiteralViolations", name: "Admin Status Literals", initial: 2 },
  { key: "missingPublicBarrels", name: "Public Barrel index.ts", initial: 7 },
  { key: "missingDomainManifests", name: "Domain manifest.yaml", initial: 3 },
  { key: "duplicateCodeClones", name: "Duplicate Code Clones", initial: 15, deferred: "PR 6A" },
  { key: "orphanFiles", name: "Orphan Files", initial: 1, deferred: "PR 6B" },
];

function formatRatchetMatrix() {
  let baselines = {};
  if (fs.existsSync(BASELINE_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
      baselines = data.baselines || {};
    } catch (_e) {
      baselines = {};
    }
  }

  const lines = [
    "╔════════════════════════════════════════════════════════════╗",
    "║               Ratchet Technical Debt Matrix                ║",
    "╠════════════════════════════════════════════════════════════╣",
    "║  Category                  Initial   Current    Status     ║",
    "╠════════════════════════════════════════════════════════════╣",
  ];

  for (const item of INITIAL_RATISTICS) {
    const val = baselines[item.key];
    let current = 0;
    if (typeof val === "number") {
      current = val;
    } else if (Array.isArray(val)) {
      current = val.length;
    }

    let statusStr = "✅ Remediated";
    if (item.deferred) {
      statusStr = `⏸ Deferred (${item.deferred})`;
    } else if (current > 0) {
      statusStr = "⚠️ Active Debt";
    }

    const catCol = item.name.padEnd(25, " ");
    const initCol = String(item.initial).padStart(5, " ");
    const currCol = String(current).padStart(7, " ");
    const statCol = statusStr.padEnd(16, " ");

    lines.push(`║  ${catCol} ${initCol}  ${currCol}   ${statCol}  ║`);
  }

  lines.push("╚════════════════════════════════════════════════════════════╝");
  return lines.join("\n");
}

module.exports = {
  formatRatchetMatrix,
};
