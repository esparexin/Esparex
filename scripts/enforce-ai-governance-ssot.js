#!/usr/bin/env node

const { execSync } = require("child_process");

const trackedFiles = execSync("git ls-files", {
  cwd: process.cwd(),
  encoding: "utf8",
})
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const AI_GOVERNANCE_ROOT = "ai-governance/";

const BANNED_TRACKED_PREFIXES = [
  ".config/",
  ".kilo/",
  ".kombai/",
  ".claude/",
];

const BANNED_TRACKED_EXACT = new Set([
  ".antigravity.system.prompt.md",
  ".cursorrules",
  "frontend/.cursorrules",
  ".vscode/esparex-lockdown.code-snippets",
  "AI_CHANGE_SOP.md",
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

  if (BANNED_TRACKED_EXACT.has(filePath)) {
    violations.push({
      file: filePath,
      reason: "Tracked local AI/tool compatibility file outside ai-governance/",
    });
    continue;
  }

  if (BANNED_TRACKED_PREFIXES.some((prefix) => filePath.startsWith(prefix))) {
    violations.push({
      file: filePath,
      reason: "Tracked local AI/tool configuration directory outside ai-governance/",
    });
    continue;
  }

  if (BANNED_OUTSIDE_GOVERNANCE_PATTERNS.some((pattern) => pattern.test(filePath))) {
    violations.push({
      file: filePath,
      reason: "AI governance or tool-specific instruction file must live under ai-governance/",
    });
  }
}

if (violations.length > 0) {
  console.error("❌ AI governance SSOT guard failed.");
  console.error("The following tracked files must be consolidated under ai-governance/:");
  for (const violation of violations) {
    console.error(`  - ${violation.file} :: ${violation.reason}`);
  }
  console.error("\n💡 HINT:");
  console.error("   1) Keep authoritative AI governance only in ai-governance/.");
  console.error("   2) Keep local IDE/tool files ignored and non-authoritative.");
  console.error("   3) Use ai-governance/AGENTS/ wrappers if a tool needs a compatibility layer.");
  process.exit(1);
}

console.log("✅ AI governance SSOT guard passed.");
