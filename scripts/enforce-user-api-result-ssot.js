#!/usr/bin/env node

/**
 * Enforce frontend user API SSOT:
 * `frontend/src/api/user/*` must not import legacy safeWrapper helpers.
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const USER_API_DIR = path.join(ROOT, "frontend", "src", "lib", "api", "user");
const DISALLOWED = [
  "@/lib/api/safeWrapper",
  "../lib/api/safeWrapper",
  "../../lib/api/safeWrapper",
];

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    const ext = path.extname(entry.name);
    if (SOURCE_EXTENSIONS.has(ext)) {
      files.push(fullPath);
    }
  }
  return files;
}

function hasDisallowedImport(source) {
  const importMatches = source.match(/import\s+[^;]+from\s+['"][^'"]+['"]/g) || [];
  return importMatches.some((stmt) => DISALLOWED.some((token) => stmt.includes(token)));
}

function main() {
  if (!fs.existsSync(USER_API_DIR)) {
    console.error(`❌ Missing directory: ${USER_API_DIR}`);
    process.exit(1);
  }

  const offending = [];
  const files = walk(USER_API_DIR);

  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    if (hasDisallowedImport(source)) {
      offending.push(path.relative(ROOT, file));
    }
  }

  if (offending.length > 0) {
    console.error("❌ Legacy safeWrapper imports are not allowed in frontend/src/api/user/*");
    for (const file of offending) {
      console.error(`   - ${file}`);
    }
    console.error("\n[HINT] Platform standard requires the new Result/Error envelope pattern.");
    console.error("1. Remove 'safeWrapper' and use the centralized 'withResult' or direct fetches.");
    console.error("2. Ensure the API response reflects the SSOT contract defined in @shared/contracts.\n");
    process.exit(1);
  }

  console.log("✅ User API result SSOT check passed (no safeWrapper imports).");
}

main();
