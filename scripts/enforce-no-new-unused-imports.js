#!/usr/bin/env node

const { execSync, spawnSync } = require("node:child_process");

const WORKSPACE_ROOTS = ["frontend", "backend", "admin-frontend"];

function run(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }).trim();
}

function resolveBaseRef() {
  const ghBase = process.env.GITHUB_BASE_REF;
  if (ghBase) return `origin/${ghBase}`;
  return "origin/main";
}

function resolveMergeBase(baseRef) {
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

function getChangedTsFiles(baseSha) {
  if (!baseSha) return [];
  const raw = run(`git diff --name-only --diff-filter=ACMR ${baseSha}...HEAD`);
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((file) => /\.(ts|tsx)$/.test(file))
    .filter((file) => WORKSPACE_ROOTS.some((root) => file.startsWith(`${root}/src/`)));
}

function groupByWorkspace(files) {
  const grouped = new Map();
  for (const file of files) {
    const [workspace] = file.split("/");
    const rel = file.replace(`${workspace}/`, "");
    if (!grouped.has(workspace)) grouped.set(workspace, []);
    grouped.get(workspace).push(rel);
  }
  return grouped;
}

function lintWorkspaceChangedFiles(workspace, files) {
  if (!files.length) return 0;
  const args = [
    "eslint",
    ...files,
    "--max-warnings=0",
    "--rule",
    "unused-imports/no-unused-imports:error",
  ];
  const result = spawnSync("npx", args, {
    cwd: workspace,
    stdio: "inherit",
    shell: false,
  });
  return result.status ?? 1;
}

function main() {
  const baseRef = resolveBaseRef();
  const baseSha = resolveMergeBase(baseRef);

  if (!baseSha) {
    console.log("✅ Skipping unused import guard (git base could not be resolved).");
    return;
  }

  const changed = getChangedTsFiles(baseSha);

  if (changed.length === 0) {
    console.log("✅ No TypeScript changes detected for unused import guard.");
    return;
  }

  const grouped = groupByWorkspace(changed);
  let hasFailures = false;

  for (const [workspace, files] of grouped.entries()) {
    console.log(`Checking unused imports in changed files (${workspace})...`);
    const status = lintWorkspaceChangedFiles(workspace, files);
    if (status !== 0) {
      hasFailures = true;
    }
  }

  if (hasFailures) {
    console.error("❌ New unused imports detected in changed files.");
    process.exit(1);
  }

  console.log("✅ Unused import guard passed.");
}

main();
