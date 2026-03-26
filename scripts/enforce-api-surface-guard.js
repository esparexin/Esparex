#!/usr/bin/env node

const { execSync } = require("node:child_process");

const FORBIDDEN_PATTERNS = [
  { regex: /\/api\/admin\//, replacement: "/api/v1/admin/*" },
  { regex: /(^|["'`])\/admin\//, replacement: "/api/v1/admin/*" },
  { regex: /\/api\/v1\/contact\//, replacement: "/api/v1/contacts/*" },
];

const ROUTE_SCOPE = [
  "backend/src/app.ts",
  "backend/src/routes",
];

function run(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }).trim();
}

function resolveBaseRef() {
  const ghBase = process.env.GITHUB_BASE_REF;
  if (ghBase) return `origin/${ghBase}`;
  return "origin/main";
}

function safeResolveMergeBase(baseRef) {
  try {
    return run(`git merge-base HEAD ${baseRef}`);
  } catch {
    try {
      return run("git rev-parse HEAD~1");
    } catch {
      return "";
    }
  }
}

function getDiff(baseSha) {
  if (!baseSha) return "";
  const scope = ROUTE_SCOPE.join(" ");
  try {
    return run(`git diff --unified=0 --no-color ${baseSha}...HEAD -- ${scope}`);
  } catch {
    return "";
  }
}

function findViolations(diffText) {
  const violations = [];
  const lines = diffText.split("\n");
  let currentFile = "";

  for (const line of lines) {
    if (line.startsWith("+++ b/")) {
      currentFile = line.slice(6);
      continue;
    }
    if (!line.startsWith("+") || line.startsWith("+++")) continue;

    for (const { regex, replacement } of FORBIDDEN_PATTERNS) {
      if (!regex.test(line)) continue;
      violations.push({
        file: currentFile || "unknown",
        line: line.slice(1).trim(),
        replacement,
      });
    }
  }
  return violations;
}

function main() {
  const baseRef = resolveBaseRef();
  const baseSha = safeResolveMergeBase(baseRef);
  const diffText = getDiff(baseSha);

  if (!diffText) {
    console.log("✅ API surface guard passed (no route-surface additions detected).");
    return;
  }

  const violations = findViolations(diffText);
  if (violations.length === 0) {
    console.log("✅ API surface guard passed.");
    return;
  }

  console.error("❌ API surface guard failed.");
  for (const v of violations) {
    console.error(`- ${v.file}: ${v.line}`);
    console.error(
      `  Duplicate API detected. Use canonical ${v.replacement} endpoint.`
    );
  }
  console.error("\n💡 HINT: Forbidden API surface patterns detected. Ensure you are using canonical versioned routes (e.g., /api/v1/...).");
  console.error("   Directly accessing /api/admin/ is deprecated. Update the caller to use the version-prefixed endpoint.");
  process.exit(1);
}

main();
