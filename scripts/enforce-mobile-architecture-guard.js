#!/usr/bin/env node

/**
 * enforce-mobile-architecture-guard.js
 *
 * Automated Architecture Guard for Esparex Mobile (`apps/mobile/src`).
 * Enforces strict layer boundaries:
 *
 * 1. Presentation (screens, steps, components) MUST NOT import:
 *    - infrastructure/
 *    - Api* implementations directly
 *    - apiClient directly
 *
 * 2. Presentation Hooks MUST NOT import:
 *    - infrastructure/
 *    - Api* implementations directly
 *    - apiClient directly
 *
 * 3. Application Services & Domain MUST NOT import:
 *    - presentation/
 *    - infrastructure/ (except via bootstrap composition root)
 *    - react / react-native
 */

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const mobileSrcDir = path.join(repoRoot, "apps", "mobile", "src");

if (!fs.existsSync(mobileSrcDir)) {
  console.log("Mobile package not found, skipping mobile architecture guard.");
  process.exit(0);
}

function toUnixPath(input) {
  return input.replaceAll(path.sep, "/");
}

function walk(dir, output = []) {
  if (!fs.existsSync(dir)) return output;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (["node_modules", "dist", ".expo", "coverage"].includes(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, output);
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      output.push(fullPath);
    }
  }
  return output;
}

const allFiles = walk(mobileSrcDir);
const violations = [];

for (const filePath of allFiles) {
  const relPath = toUnixPath(path.relative(mobileSrcDir, filePath));
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    // Only inspect import statements
    if (!/^\s*import\b/.test(line)) return;

    const lineNum = index + 1;

    // Rule 1: Presentation & Presentation Hooks cannot import infrastructure or Api* classes directly
    if (relPath.includes("/presentation/")) {
      if (line.includes("/infrastructure/") || line.includes("infrastructure/api/apiClient")) {
        violations.push({
          file: relPath,
          line: lineNum,
          rule: "Presentation cannot import infrastructure or apiClient directly. Use application hooks/services.",
          code: line.trim(),
        });
      }
      if (/import.*Api[A-Z]\w+/.test(line)) {
        violations.push({
          file: relPath,
          line: lineNum,
          rule: "Presentation cannot import concrete Api* implementations directly. Depend on service abstractions.",
          code: line.trim(),
        });
      }
    }

    // (Concrete Api* / Expo* adapters are allowed to import infrastructure / native modules)
    const isConcreteApiAdapter =
      /(^|\/)Api[A-Z]\w+\.ts$/.test(relPath) ||
      relPath.endsWith("ImageUploadService.ts") ||
      relPath.endsWith("ExpoImagePicker.ts") ||
      relPath.includes("/infrastructure/");
    const isPureDomainOrService =
      relPath.includes("/domain/") ||
      relPath.endsWith("Service.ts") ||
      relPath.endsWith("Validator.ts") ||
      relPath.endsWith("Hook.ts");

    if (
      (relPath.includes("/application/") || relPath.includes("/domain/")) &&
      !relPath.includes("/bootstrap/")
    ) {
      if (line.includes("/presentation/")) {
        violations.push({
          file: relPath,
          line: lineNum,
          rule: "Application services & domain cannot import presentation layer code.",
          code: line.trim(),
        });
      }
      if (line.includes("/infrastructure/") && !isConcreteApiAdapter) {
        violations.push({
          file: relPath,
          line: lineNum,
          rule: "Pure domain models, services, and validators cannot import infrastructure directly.",
          code: line.trim(),
        });
      }
      if (/from\s+['"]react(-native)?['"]/.test(line) && !line.includes("type ")) {
        violations.push({
          file: relPath,
          line: lineNum,
          rule: "Application services & domain cannot import React or React Native UI packages.",
          code: line.trim(),
        });
      }
    }
  });
}

if (violations.length > 0) {
  console.error("❌ Mobile Architecture Guard Violations Found:\n");
  for (const v of violations) {
    console.error(`  [${v.file}:${v.line}] ${v.rule}`);
    console.error(`    > ${v.code}\n`);
  }
  process.exit(1);
} else {
  console.log("✅ Mobile Architecture Guard: All mobile layer boundaries clean.");
  process.exit(0);
}
