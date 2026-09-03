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

    // Rule 4: Zero-Capacitor & Legacy Mobile Wrapper Prevention Gate
    if (/@capacitor\b|@ionic\b|cordova\b/i.test(line)) {
      violations.push({
        file: relPath,
        line: lineNum,
        rule: "Capacitor, Ionic, or Cordova legacy packages are strictly forbidden. Use Expo SDK 52 / React Native primitives.",
        code: line.trim(),
      });
    }
  });

  // Rule 5: React Rules-of-Hooks Governance — No hook calls inside try/catch blocks
  if (filePath.endsWith(".tsx") && !filePath.includes(".spec.") && !filePath.includes(".test.")) {
    const tryBlockRegex = /try\s*\{[^}]*\buse[A-Z]\w*\s*\(/gs;
    let match;
    while ((match = tryBlockRegex.exec(content)) !== null) {
      const matchIndex = match.index;
      const lineNum = content.slice(0, matchIndex).split("\n").length;
      violations.push({
        file: relPath,
        line: lineNum,
        rule: "React hooks (use*) must never be called inside try/catch blocks. Provide safe fallback context.",
        code: match[0].replace(/\s+/g, " ").slice(0, 80),
      });
    }
  }

  // Rule 6: Multi-Step Form Wizard Hardware BackHandler Enforcement (Screen level)
  if (
    filePath.endsWith("Screen.tsx") &&
    (relPath.includes("Wizard") || content.includes("WizardStep") || content.includes("STEPS_ORDER"))
  ) {
    if (!content.includes("BackHandler") || !content.includes("hardwareBackPress")) {
      violations.push({
        file: relPath,
        line: 1,
        rule: "Multi-step form wizards on Android must handle hardwareBackPress via BackHandler to prevent losing user progress.",
        code: "Missing BackHandler.addEventListener('hardwareBackPress', ...)",
      });
    }
  }
}

// Rule 7: Orphan Screen Prevention Gate (All presentation screens must be registered in navigation)
const navigationFiles = walk(path.join(mobileSrcDir, "navigation"));
const navigationContent = navigationFiles.map((f) => fs.readFileSync(f, "utf8")).join("\n");
const screenFiles = allFiles.filter(
  (f) =>
    f.includes(path.sep + "presentation" + path.sep + "screens" + path.sep) &&
    f.endsWith(".tsx") &&
    !f.includes(".spec.") &&
    !f.includes(".test.") &&
    !f.includes(".styles.")
);

for (const screenFile of screenFiles) {
  const screenName = path.basename(screenFile, ".tsx");
  if (!navigationContent.includes(screenName)) {
    const relScreenPath = toUnixPath(path.relative(mobileSrcDir, screenFile));
    violations.push({
      file: relScreenPath,
      line: 1,
      rule: "Dead/Orphan Screen Detected: Every screen component must be mounted in a navigation stack or registered in routes.ts.",
      code: `Screen '${screenName}' is not referenced in apps/mobile/src/navigation/`,
    });
  }
}

// Global Repository Capacitor Artifact Prevention Check
const forbiddenCapacitorFiles = [
  "apps/mobile/capacitor.config.ts",
  "apps/mobile/capacitor.config.json",
  "capacitor.config.ts",
  "capacitor.config.json"
];

for (const relFile of forbiddenCapacitorFiles) {
  const fullCheckPath = path.join(repoRoot, relFile);
  if (fs.existsSync(fullCheckPath)) {
    violations.push({
      file: relFile,
      line: 1,
      rule: "Capacitor configuration file detected. Capacitor architecture is deprecated and prohibited.",
      code: "capacitor.config.*",
    });
  }
}

// Rule 8: Category SSOT Ownership Guard
// Ensures no duplicate getCategories methods are declared in listing services or repositories
for (const filePath of allFiles) {
  const relPath = toUnixPath(path.relative(mobileSrcDir, filePath));
  if (
    relPath.endsWith("ListingService.ts") ||
    relPath.endsWith("IListingRepository.ts") ||
    relPath.endsWith("ApiListingRepository.ts")
  ) {
    const content = fs.readFileSync(filePath, "utf8");
    if (/\bgetCategories\s*\(/.test(content)) {
      violations.push({
        file: relPath,
        line: 1,
        rule: "Category SSOT Violation: Categories must be accessed solely via CategoryService. Do not duplicate getCategories() in listing services or repositories.",
        code: "getCategories() declared in " + relPath,
      });
    }
  }
}

// Rule 9: Device Condition SSOT Filter Guard
// Prevents zombie condition options (new, used_like_new, used_good, used_fair) in mobile search filters
const filterModalPath = path.join(mobileSrcDir, "features", "listings", "presentation", "components", "FilterModal.tsx");
if (fs.existsSync(filterModalPath)) {
  const filterModalContent = fs.readFileSync(filterModalPath, "utf8");
  if (/['"]used_like_new['"]|['"]used_good['"]|['"]used_fair['"]/.test(filterModalContent)) {
    violations.push({
      file: "features/listings/presentation/components/FilterModal.tsx",
      line: 1,
      rule: "Zombie Filter Option Detected: FilterModal must use canonical 'power_on' and 'power_off' options matching backend schema and domain model.",
      code: "Non-canonical condition option detected in FilterModal.tsx",
    });
  }
}

if (violations.length > 0) {
  console.error("❌ Mobile Architecture Guard Violations Found:\n");
  for (const v of violations) {
    console.error(`  [${v.file}:${v.line}] ${v.rule}`);
    console.error(`    > ${v.code}\n`);
  }
  process.exit(1);
} else {
  console.log("✅ Mobile Architecture Guard: All mobile layer boundaries, hook hygiene, screen registry, and platform rules clean.");
  process.exit(0);
}

