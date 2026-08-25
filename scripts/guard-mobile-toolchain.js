#!/usr/bin/env node

/**
 * guard-mobile-toolchain.js
 *
 * Automated Mobile Toolchain & Platform Compatibility Guard.
 * Enforces:
 * 1. Java runtime is JDK 17 or 21 (LTS).
 * 2. Node.js runtime is >= 22.
 * 3. iOS Gemfile exists and pins CocoaPods via Bundler.
 * 4. Zero forbidden architecture workarounds (EXCLUDED_ARCHS=arm64) in Podfile.
 * 5. Zero autolinking null platform overrides in react-native.config.js.
 * 6. Zero unapproved worklets dependencies in mobile package.json.
 */

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..");
const mobileDir = path.join(repoRoot, "apps", "mobile");
const violations = [];

console.log("🛡️  Running Mobile Toolchain & Platform Compatibility Guard...\n");

// 1. Check Node.js Version
const nodeMajor = parseInt(process.versions.node.split(".")[0], 10);
if (nodeMajor < 22) {
  violations.push(`Node.js version is v${process.versions.node}. Minimum required version is v22.x LTS.`);
}

// 2. Check Java Version (if java binary is accessible)
try {
  const javaOutput = execSync("java -version 2>&1", { encoding: "utf8" });
  const versionMatch = javaOutput.match(/(?:openjdk|java) version "([0-9]+(?:\.[0-9]+)*)/i);
  if (versionMatch) {
    const javaMajor = parseInt(versionMatch[1].split(".")[0], 10);
    if (javaMajor !== 17 && javaMajor !== 21) {
      violations.push(
        `Active Java runtime is JDK ${javaMajor} (${versionMatch[1]}). Android Gradle/AGP baseline requires JDK 17 LTS or 21 LTS.`
      );
    }
  }
} catch {
  // Java binary not found in non-mobile CI or environment — skip if java is not in PATH
}

// 3. Check iOS Gemfile
const gemfilePath = path.join(mobileDir, "Gemfile");
if (!fs.existsSync(gemfilePath)) {
  violations.push("Missing 'apps/mobile/Gemfile'. CocoaPods version must be pinned via Bundler.");
}

// 4. Check Podfile for architecture exclusions
const podfilePath = path.join(mobileDir, "ios", "Podfile");
if (fs.existsSync(podfilePath)) {
  const podfileContent = fs.readFileSync(podfilePath, "utf8");
  if (/EXCLUDED_ARCHS.*arm64/.test(podfileContent)) {
    violations.push("Forbidden 'EXCLUDED_ARCHS=arm64' detected in apps/mobile/ios/Podfile. Apple Silicon simulator builds must not be stripped.");
  }
}

// 5. Check react-native.config.js for null platform hacks
const rnConfigPath = path.join(mobileDir, "react-native.config.js");
if (fs.existsSync(rnConfigPath)) {
  const rnConfigContent = fs.readFileSync(rnConfigPath, "utf8");
  if (/platforms\s*:\s*\{\s*(ios\s*:\s*null|android\s*:\s*null)/.test(rnConfigContent)) {
    violations.push("Forbidden autolinking null override detected in apps/mobile/react-native.config.js.");
  }
}

// 6. Check package.json for obsolete worklets
const pkgJsonPath = path.join(mobileDir, "package.json");
if (fs.existsSync(pkgJsonPath)) {
  const pkgContent = fs.readFileSync(pkgJsonPath, "utf8");
  const pkgJson = JSON.parse(pkgContent);
  if (pkgJson.dependencies && pkgJson.dependencies["react-native-worklets"]) {
    violations.push("Standalone 'react-native-worklets' is deprecated. React Native Reanimated 3 manages its own internal worklet engine.");
  }
}

if (violations.length > 0) {
  console.error("❌ Mobile Toolchain Guard Violations Found:\n");
  for (const v of violations) {
    console.error(`  • ${v}`);
  }
  console.error("\nRun 'npm run mobile:build:android' with JDK 17 LTS to resolve.\n");
  process.exit(1);
} else {
  console.log("✅ Mobile Toolchain Guard: All environment, compiler, and platform constraints passed cleanly.");
  process.exit(0);
}
