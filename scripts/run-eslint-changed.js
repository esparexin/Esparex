#!/usr/bin/env node

const { execSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const WORKSPACES = ["frontend", "backend", "admin-frontend"];

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

function getChangedLintFiles(baseSha) {
  if (!baseSha) return [];
  const raw = run(`git diff --name-only --diff-filter=ACMR ${baseSha}...HEAD`);
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((file) => /\.(js|jsx|ts|tsx)$/.test(file))
    .filter((file) => WORKSPACES.some((ws) => file.startsWith(`${ws}/`)));
}

function groupFiles(files) {
  const grouped = new Map();
  for (const file of files) {
    const [workspace] = file.split("/");
    const rel = file.replace(`${workspace}/`, "");
    if (!grouped.has(workspace)) grouped.set(workspace, []);
    grouped.get(workspace).push(rel);
  }
  return grouped;
}

function lintWorkspaceFiles(workspace, files) {
  if (!files.length) return 0;
  const result = spawnSync("npx", ["eslint", ...files], {
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
    console.log("✅ Skipping lint guard (git base could not be resolved).");
    return;
  }

  const changedFiles = getChangedLintFiles(baseSha);
  if (changedFiles.length === 0) {
    console.log("✅ No JS/TS changes detected for lint guard.");
    return;
  }

  const grouped = groupFiles(changedFiles);
  let hasFailures = false;

  for (const [workspace, files] of grouped.entries()) {
    console.log(`Running ESLint for changed files in ${workspace}...`);
    // Final safety check: filter out files that may have been deleted/moved
    const existingFiles = files.filter(f => fs.existsSync(path.join(workspace, f)));
    if (existingFiles.length === 0) continue;
    
    const status = lintWorkspaceFiles(workspace, existingFiles);
    if (status !== 0) hasFailures = true;
  }

  if (hasFailures) {
    console.error("❌ ESLint failed on changed files.");
    process.exit(1);
  }

  console.log("✅ ESLint passed on changed files.");
}

main();
