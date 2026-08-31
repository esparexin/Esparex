#!/usr/bin/env node

const { execSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const WORKSPACE_ROOTS = ["apps/admin", "apps/web", "backend/api", "core", "shared"];

function run(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }).trim();
}

function resolveBaseRef() {
  const ghBase = process.env.GITHUB_BASE_REF;
  if (ghBase) return `origin/${ghBase}`;
  try {
    run('git rev-parse --verify origin/develop');
    return 'origin/develop';
  } catch {
    return 'origin/main';
  }
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

function getChangedTsFiles(baseSha, isStaged) {
  let diffCmd = "";
  if (isStaged) {
    diffCmd = "git diff --cached --name-only --diff-filter=ACMR";
  } else if (baseSha) {
    diffCmd = `git diff --name-only --diff-filter=ACMR ${baseSha}...HEAD`;
  } else {
    return [];
  }

  try {
    const raw = run(diffCmd);
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((file) => /\.(ts|tsx)$/.test(file))
      .filter((file) => WORKSPACE_ROOTS.some((root) => file.startsWith(`${root}/src/`)));
  } catch {
    return [];
  }
}

function groupByWorkspace(files) {
  const grouped = new Map();
  for (const file of files) {
    const root = WORKSPACE_ROOTS.find((r) => file.startsWith(`${r}/`));
    if (!root) continue;
    const rel = file.slice(root.length + 1);
    if (!grouped.has(root)) grouped.set(root, []);
    grouped.get(root).push(rel);
  }
  return grouped;
}

function lintWorkspaceChangedFiles(workspace, files) {
  if (!files.length) return 0;
  const args = [
    "eslint",
    ...files,
    "--format=json",
    "--rule",
    "unused-imports/no-unused-imports:error",
    "--rule",
    "@typescript-eslint/no-unused-vars:off",
    "--rule",
    "unused-imports/no-unused-vars:off",
  ];

  const result = spawnSync("npx", args, {
    cwd: path.resolve(workspace),
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });

  if (result.status === 0) return 0;

  const stdout = result.stdout ? result.stdout.trim() : "";
  if (!stdout) {
    if (result.stderr) console.error(result.stderr);
    return result.status || 1;
  }

  try {
    const report = JSON.parse(stdout);
    const violations = [];
    for (const item of report) {
      const messages = (item.messages || []).filter(
        (m) => m.ruleId === "unused-imports/no-unused-imports"
      );
      if (messages.length > 0) {
        violations.push({ filePath: item.filePath, messages });
      }
    }

    if (violations.length === 0) return 0;

    console.error(`\n❌ Unused imports found in ${workspace}:`);
    for (const v of violations) {
      const rel = path.relative(process.cwd(), v.filePath);
      for (const m of v.messages) {
        console.error(`  ${rel}:${m.line}:${m.column} - ${m.message}`);
      }
    }
    return 1;
  } catch {
    if (result.stdout) console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);
    return result.status || 1;
  }
}

function getAllTsFiles() {
  const allFiles = [];
  for (const root of WORKSPACE_ROOTS) {
    const srcDir = path.join(process.cwd(), root, "src");
    if (!fs.existsSync(srcDir)) continue;
    function walk(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (/\.(ts|tsx)$/.test(entry.name)) {
          allFiles.push(path.relative(process.cwd(), full));
        }
      }
    }
    walk(srcDir);
  }
  return allFiles;
}

function main() {
  const isStaged = process.argv.includes("--staged");
  const isAll = process.argv.includes("--all");
  let changed = [];

  if (isAll) {
    changed = getAllTsFiles();
  } else if (isStaged) {
    changed = getChangedTsFiles("", true);
  } else {
    const baseRef = resolveBaseRef();
    const baseSha = resolveMergeBase(baseRef);
    changed = getChangedTsFiles(baseSha, false);
  }

  if (changed.length === 0) {
    console.log(`ℹ️  No TypeScript changes detected for unused import guard (${isAll ? 'full workspace' : isStaged ? 'staged index' : 'branch diff'}).`);
    return;
  }

  const grouped = groupByWorkspace(changed);
  let hasFailures = false;

  for (const [workspace, files] of grouped.entries()) {
    console.log(`Checking unused imports in ${isAll ? 'all workspace files' : 'changed files'} (${workspace})...`);
    const existingFiles = files.filter(f => fs.existsSync(path.join(workspace, f)));
    if (existingFiles.length === 0) continue;

    const status = lintWorkspaceChangedFiles(workspace, existingFiles);
    if (status !== 0) {
      hasFailures = true;
    }
  }

  if (hasFailures) {
    console.error("❌ Unused imports detected in workspace files.");
    process.exit(1);
  }

  console.log("✅ Unused import guard passed.");
}

main();
