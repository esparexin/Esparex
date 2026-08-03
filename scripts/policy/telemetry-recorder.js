const fs = require("fs");
const path = require("path");

const GOVERNANCE_DIR = path.resolve(__dirname, "../../.governance");
const LATEST_RUN_PATH = path.join(GOVERNANCE_DIR, "latest-run.json");
const HISTORY_PATH = path.join(GOVERNANCE_DIR, "telemetry-history.json");
const SUMMARY_PATH = path.join(GOVERNANCE_DIR, "governance-summary.json");
const BASELINE_PATH = path.resolve(__dirname, "governance-debt-baseline.json");

const MAX_HISTORY_ENTRIES = 50;

function ensureGovernanceDir() {
  if (!fs.existsSync(GOVERNANCE_DIR)) {
    fs.mkdirSync(GOVERNANCE_DIR, { recursive: true });
  }
}

function getGitBranch() {
  try {
    const head = fs.readFileSync(path.resolve(__dirname, "../../.git/HEAD"), "utf8").trim();
    if (head.startsWith("ref: refs/heads/")) {
      return head.replace("ref: refs/heads/", "");
    }
    return "detached";
  } catch (_e) {
    return "unknown";
  }
}

function loadBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
  } catch (_e) {
    return null;
  }
}

function recordTelemetry(results, hasBlockers) {
  ensureGovernanceDir();

  const totalElapsedMs = results.reduce((acc, r) => acc + (r.elapsedMs || 0), 0);
  const passedCount = results.filter((r) => r.errors.length === 0).length;
  const failedCount = results.filter((r) => r.errors.length > 0).length;
  const healthScore = Math.round((passedCount / (results.length || 1)) * 100);
  const timestamp = new Date().toISOString();
  const branch = getGitBranch();

  const latestRun = {
    timestamp,
    branch,
    status: hasBlockers ? "FAIL" : "PASS",
    healthScore,
    totalElapsedMs,
    checksCount: results.length,
    passedCount,
    failedCount,
    checks: results.map((r) => ({
      id: r.meta?.id || "UNKNOWN",
      name: r.meta?.name || "Unknown Check",
      status: r.errors.length > 0 ? "FAIL" : "PASS",
      elapsedMs: r.elapsedMs || 0,
      errorsCount: r.errors.length,
      warningsCount: r.warnings.length,
      infoCount: r.info.length,
    })),
  };

  // 1. Write latest-run.json
  fs.writeFileSync(LATEST_RUN_PATH, JSON.stringify(latestRun, null, 2), "utf8");

  // 2. Append to telemetry-history.json
  let history = [];
  if (fs.existsSync(HISTORY_PATH)) {
    try {
      history = JSON.parse(fs.readFileSync(HISTORY_PATH, "utf8"));
      if (!Array.isArray(history)) history = [];
    } catch (_e) {
      history = [];
    }
  }

  history.unshift({
    timestamp,
    branch,
    status: latestRun.status,
    healthScore,
    totalElapsedMs,
    passedCount,
    failedCount,
  });

  if (history.length > MAX_HISTORY_ENTRIES) {
    history = history.slice(0, MAX_HISTORY_ENTRIES);
  }

  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2), "utf8");

  // 3. Write governance-summary.json
  const baselineData = loadBaseline();
  const baselines = baselineData?.baselines || {};

  const totalRuns = history.length;
  const passedRuns = history.filter((h) => h.status === "PASS").length;
  const passRatePercent = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 100;
  const avgDurationMs = totalRuns > 0 ? Math.round(history.reduce((a, b) => a + b.totalElapsedMs, 0) / totalRuns) : totalElapsedMs;

  const archCheck = results.find((r) => r.meta?.id === "ARCH-PLATFORM-001");
  const ssotCheck = results.find((r) => r.meta?.id === "SSOT-001");

  const summary = {
    updatedAt: timestamp,
    status: latestRun.status,
    healthScore,
    architectureScore: archCheck && archCheck.errors.length === 0 ? 100 : 0,
    ssotStatus: ssotCheck && ssotCheck.errors.length === 0 ? "PASS" : "FAIL",
    ratchet: {
      initialDebtCount: 29, // Historical total baseline count before PR 4B
      remediatedCategories: [
        "namingViolations",
        "platformGovernanceViolations",
        "adminStatusLiteralViolations",
        "missingPublicBarrels",
        "missingDomainManifests",
      ],
      deferredCategories: [
        { category: "duplicateCodeClones", count: baselines.duplicateCodeClones || 15 },
        { category: "orphanFiles", count: Array.isArray(baselines.orphanFiles) ? baselines.orphanFiles.length : 1 },
      ],
    },
    metrics: {
      totalRunsRecorded: totalRuns,
      averageDurationMs: avgDurationMs,
      passRatePercent,
    },
  };

  fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2), "utf8");
}

module.exports = {
  recordTelemetry,
};
