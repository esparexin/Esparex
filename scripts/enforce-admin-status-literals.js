const fs = require("fs");
const path = require("path");

const ADMIN_VIEWS_ROOT = path.resolve(
  __dirname,
  "..",
  "frontend",
  "src",
  "components",
  "admin",
  "views"
);

const FILE_EXTENSIONS = new Set([".ts", ".tsx"]);
const DISALLOWED_STATUS_LITERALS = [
  "pending",
  "active",
  "approved",
  "rejected",
  "expired",
  "sold",
  "open",
  "resolved",
  "dismissed",
  "inactive",
  "read-only",
  "closed",
  "suspended",
  "banned",
  "verified",
];

function collectFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }
    if (FILE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function findViolations(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const violations = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    for (const literal of DISALLOWED_STATUS_LITERALS) {
      const pattern = new RegExp(`(['"])${literal}\\1`, "g");
      if (pattern.test(line)) {
        violations.push({
          line: i + 1,
          literal,
          source: line.trim(),
        });
      }
    }
  }

  return violations;
}

function main() {
  if (!fs.existsSync(ADMIN_VIEWS_ROOT)) {
    console.log(
      "PASS: frontend/src/components/admin/views does not exist — nothing to scan."
    );
    return;
  }

  const files = collectFiles(ADMIN_VIEWS_ROOT);
  const allViolations = [];

  for (const filePath of files) {
    const violations = findViolations(filePath);
    if (violations.length > 0) {
      allViolations.push({
        filePath,
        violations,
      });
    }
  }

  if (allViolations.length === 0) {
    console.log(
      "PASS: no raw admin status literals found in frontend/src/components/admin/views."
    );
    return;
  }

  console.error(
    "FAIL: raw admin status literals detected. Use shared constants from frontend/src/lib/status/adminStatusConstants.ts"
  );

  for (const fileEntry of allViolations) {
    const relPath = path.relative(process.cwd(), fileEntry.filePath);
    for (const violation of fileEntry.violations) {
      console.error(
        `  ${relPath}:${violation.line} literal='${violation.literal}' -> ${violation.source}`
      );
    }
  }

  console.error("\n[HINT] Do not use hardcoded status strings in Admin views.");
  console.error("1. Import ADMIN_STATUS from '@/lib/status/adminStatusConstants'.");
  console.error("2. Use constants like ADMIN_STATUS.ACTIVE instead of 'active'.\n");

  process.exit(1);
}

main();

