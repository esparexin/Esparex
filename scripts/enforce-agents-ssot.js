#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const trackedFiles = execSync("git ls-files", {
  cwd: process.cwd(),
  encoding: "utf8",
})
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const trackedSet = new Set(trackedFiles);

// PR #645: required canonical governance docs must not silently disappear.
const REQUIRED_GOVERNANCE_DOCS = [
  "AGENTS.md",
  "ARCHITECTURE.md",
  "docs/architecture/PLATFORM_ARCHITECTURE.md",
  "docs/governance/REPOSITORY-GOVERNANCE.md",
  "docs/tracking/engineering-action-register.md",
  "packages/ui/GOVERNANCE.md",
  "docs/README.md",
  ".github/PULL_REQUEST_TEMPLATE.md",
];

// PR #645: stale competing-authority claims remediated in docs; fail if reintroduced
// in active governance (frozen evidence in archive/audits/releases/tracking/logs/decisions excluded).
const BANNED_SUPREME_CLAIMS = [
  /single authoritative engineering governance document/i,
  /^1\.\s+\*\*UI Foundation Blueprint \(SSOT\)\*\*/m,
  /serves as the Single Source of Truth \(SSOT\) for UI tokens/i,
];

const CLAIM_SCAN_ROOTS = [
  "docs/governance/",
  "docs/architecture/",
  "packages/ui/",
  "packages/design-tokens/",
  ".agents/governance/",
  ".agents/skills/",
];

const CLAIM_SCAN_EXCLUDE = [
  "archive/",
  "audit-reports/",
  "docs/releases/",
  "docs/audits/",
  "docs/tracking/",
  ".agents/logs/",
  ".agents/decisions/",
];

const AI_GOVERNANCE_ROOT = ".agents/";

const BANNED_TRACKED_PREFIXES = [
  ".config/",
  ".kilo/",
  ".kombai/",
  ".claude/",
];

const BANNED_TRACKED_EXACT = new Set([
  "frontend/.cursorrules",
  ".vscode/esparex-lockdown.code-snippets",
  "AI_CHANGE_SOP.md",
]);

const ALLOWED_BRIDGE_FILES = new Set([
  ".antigravity.system.prompt.md",
  ".cursorrules",
]);

const BANNED_OUTSIDE_GOVERNANCE_PATTERNS = [
  /(^|\/)PROMPT_TEMPLATE\.md$/i,
  /(^|\/)AI_CONTEXT\.(json|ya?ml|md)$/i,
  /(^|\/)AI[-_](RULES|PROMPT|GOVERNANCE|BRAIN|SOP|SSOT)\.(md|json|ya?ml)$/i,
  /(^|\/).*(ANTIGRAVITY|CURSOR|CLAUDE|KOMBAI|KILO).*\.(md|json|ya?ml)$/i,
];

const violations = [];

for (const filePath of trackedFiles) {
  if (filePath.startsWith(AI_GOVERNANCE_ROOT)) {
    continue;
  }

  // Archived files are historical records — they are not active governance artifacts.
  if (filePath.startsWith('archive/')) {
    continue;
  }

  if (ALLOWED_BRIDGE_FILES.has(filePath)) {
    continue;
  }

  if (BANNED_TRACKED_EXACT.has(filePath)) {
    violations.push({
      file: filePath,
      reason: "Tracked local AI/tool compatibility file outside .agents/",
    });
    continue;
  }

  if (BANNED_TRACKED_PREFIXES.some((prefix) => filePath.startsWith(prefix))) {
    violations.push({
      file: filePath,
      reason: "Tracked local AI/tool configuration directory outside .agents/",
    });
    continue;
  }

  if (BANNED_OUTSIDE_GOVERNANCE_PATTERNS.some((pattern) => pattern.test(filePath))) {
    violations.push({
      file: filePath,
      reason: "AI governance or tool-specific instruction file must live under .agents/",
    });
  }
}

for (const required of REQUIRED_GOVERNANCE_DOCS) {
  if (!trackedSet.has(required)) {
    violations.push({
      file: required,
      reason: "Required canonical governance document is missing (PR #645 hierarchy)",
    });
  }
}

for (const filePath of trackedFiles) {
  if (!filePath.endsWith(".md")) {
    continue;
  }
  if (!CLAIM_SCAN_ROOTS.some((root) => filePath.startsWith(root))) {
    continue;
  }
  if (CLAIM_SCAN_EXCLUDE.some((prefix) => filePath.startsWith(prefix))) {
    continue;
  }
  // Consolidated pointer stubs and historical audit snapshots are not active rule claims.
  if (/(^|\/)(catalog-architecture-ssot-audit|security-inventory-audit|listing-forms-compatibility-audit)\.md$/i.test(filePath)) {
    continue;
  }
  let content = "";
  try {
    content = fs.readFileSync(path.join(process.cwd(), filePath), "utf8");
  } catch {
    continue;
  }
  for (const pattern of BANNED_SUPREME_CLAIMS) {
    if (pattern.test(content)) {
      violations.push({
        file: filePath,
        reason: `Reintroduces remediated competing-authority claim (${pattern}) — update the canonical owner instead (PR #645)`,
      });
      break;
    }
  }
}

if (violations.length > 0) {
  console.error("❌ AI governance SSOT guard failed.");
  console.error("The following tracked files must be consolidated under .agents/:");
  for (const violation of violations) {
    console.error(`  - ${violation.file} :: ${violation.reason}`);
  }
  console.error("\n💡 HINT:");
  console.error("   1) Keep authoritative AI governance only in .agents/.");
  console.error("   2) Keep local IDE/tool files ignored and non-authoritative.");
  console.error("   3) Keep tool-specific compatibility files thin and derived from .agents/ core docs.");
  process.exit(1);
}

console.log("✅ AI governance SSOT guard passed.");
