#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const RULE_NAME = "no-api-string-literals";

const repoRoot = path.resolve(__dirname, "..");
const scanRoots = [
  path.join(repoRoot, "frontend", "src"),
  path.join(repoRoot, "admin-frontend", "src"),
];

const filePattern = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const excludedPathFragments = [
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}.next${path.sep}`,
  `${path.sep}dist${path.sep}`,
  `${path.sep}tests${path.sep}`,
  `${path.sep}__tests__${path.sep}`,
  `${path.sep}shared${path.sep}contracts${path.sep}api${path.sep}`,
];
const excludedFileRegexes = [/\.spec\./, /\.test\./];
const excludedExactSuffixes = ["/frontend/src/proxy.ts"];

function toUnixPath(input) {
  return input.replaceAll(path.sep, "/");
}

function isExcluded(filePath) {
  if (!filePattern.test(filePath)) return true;
  if (excludedPathFragments.some((fragment) => filePath.includes(fragment))) {
    return true;
  }
  const unixPath = toUnixPath(filePath);
  if (excludedExactSuffixes.some((suffix) => unixPath.endsWith(suffix))) {
    return true;
  }
  return excludedFileRegexes.some((regex) => regex.test(unixPath));
}

function walk(dir, output = []) {
  if (!fs.existsSync(dir)) return output;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, output);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!isExcluded(fullPath)) {
      output.push(fullPath);
    }
  }
  return output;
}

function isApiLiteral(literal, lineText) {
  const value = literal.trim();

  const hasApiPrefix =
    value.startsWith("/api/v1") ||
    value.includes("/api/v1/") ||
    value.startsWith("/api/admin") ||
    value.includes("/api/admin/") ||
    /^https?:\/\/[^"'`]*\/api\/v1(?:\/|$)/.test(value);
  if (hasApiPrefix) return true;

  const hasResourcePrefix = /^\/(users|ads|services)(\/|$)/.test(value);
  if (!hasResourcePrefix) return false;

  return /(apiClient|adminFetch|fetch|axios|API_BASE|BASE_URL|ADMIN_API_BASE|USER_API_BASE_URL|NEXT_PUBLIC_API_URL)/.test(
    lineText
  );
}

function collectViolations(filePath) {
  const violations = [];
  const source = fs.readFileSync(filePath, "utf8");
  const lines = source.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const matches = line.matchAll(/(["'`])([^"'`]*)\1/g);
    for (const match of matches) {
      const rawLiteral = match[2] || "";
      if (!rawLiteral) continue;
      if (!isApiLiteral(rawLiteral, line)) continue;

      violations.push({
        filePath,
        line: i + 1,
        literal: rawLiteral,
      });
    }
  }

  return violations;
}

function main() {
  const files = scanRoots.flatMap((root) => walk(root));
  const violations = files.flatMap((filePath) => collectViolations(filePath));

  if (violations.length > 0) {
    console.error(`${RULE_NAME}: found ${violations.length} violation(s)`);
    for (const violation of violations) {
      const rel = toUnixPath(path.relative(repoRoot, violation.filePath));
      console.error(`- ${rel}:${violation.line} -> "${violation.literal}"`);
    }
    console.error(`\n💡 HINT: Raw API string literals are prohibited in the frontend to prevent breakage during URL refactoring.`);
    console.error(`   Action: Centralize this endpoint in @shared/contracts/api and import the constant instead.`);
    process.exit(1);
  }

  console.log(`${RULE_NAME}: passed`);
}

main();
