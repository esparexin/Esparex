#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const adminRoutesDir = path.join(repoRoot, "backend", "src", "routes", "admin");
const moderationRoutesFile = path.join(adminRoutesDir, "moderation.routes.ts");

const forbiddenModerationPathPattern =
  /router\.(?:post|patch|put|delete)\(\s*['"`]\/(?:ads|services|spare-part-listings|listings)\/:id\/(?:approve|reject|deactivate|expire|report-resolve|status|restore|promote|extend)/;

const requiredCanonicalPaths = [
  "/listings",
  "/listings/:id",
  "/listings/:id/approve",
  "/listings/:id/reject",
  "/listings/:id/deactivate",
  "/listings/:id/expire",
  "/listings/:id/report-resolve",
  "/listings/counts",
];

function main() {
  if (!fs.existsSync(moderationRoutesFile)) {
    console.error("❌ Missing moderation routes file: backend/src/routes/admin/moderation.routes.ts");
    process.exit(1);
  }

  const violations = [];
  const routeFiles = fs
    .readdirSync(adminRoutesDir)
    .filter((name) => name.endsWith(".ts"))
    .map((name) => path.join(adminRoutesDir, name));

  for (const file of routeFiles) {
    if (file === moderationRoutesFile) continue;
    const source = fs.readFileSync(file, "utf8");
    const lines = source.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (forbiddenModerationPathPattern.test(line)) {
        violations.push({
          file: path.relative(repoRoot, file),
          line: index + 1,
          source: line.trim(),
        });
      }
    });
  }

  const moderationSource = fs.readFileSync(moderationRoutesFile, "utf8");
  for (const requiredPath of requiredCanonicalPaths) {
    if (!moderationSource.includes(`'${requiredPath}'`) && !moderationSource.includes(`"${requiredPath}"`)) {
      violations.push({
        file: path.relative(repoRoot, moderationRoutesFile),
        line: 0,
        source: `Missing canonical moderation route path ${requiredPath}`,
      });
    }
  }

  if (violations.length === 0) {
    console.log("✅ Moderation namespace whitelist guard passed.");
    return;
  }

  console.error("❌ Moderation namespace whitelist guard failed.");
  for (const violation of violations) {
    const lineRef = violation.line > 0 ? `:${violation.line}` : "";
    console.error(`- ${violation.file}${lineRef} ${violation.source}`);
  }
  console.error("\n[HINT] All listing moderation actions (approve, reject, deactivate, etc.)");
  console.error("MUST be defined within 'backend/src/routes/admin/moderation.routes.ts'.");
  console.error("1. Move forbidden route definitions to the moderation router.");
  console.error("2. Ensure all required canonical paths are present in moderation.routes.ts.\n");
  process.exit(1);
}

main();

