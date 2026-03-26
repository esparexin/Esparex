#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const moderationApiFile = path.join(
  repoRoot,
  "admin-frontend",
  "src",
  "lib",
  "api",
  "moderation.ts"
);
const moderationNormalizerFile = path.join(
  repoRoot,
  "admin-frontend",
  "src",
  "components",
  "moderation",
  "normalizeModerationAd.ts"
);
const adModelFile = path.join(repoRoot, "backend", "src", "models", "Ad.ts");

const failures = [];

function readFile(filePath) {
  if (!fs.existsSync(filePath)) {
    failures.push(`Missing required file: ${path.relative(repoRoot, filePath)}`);
    return "";
  }
  return fs.readFileSync(filePath, "utf8");
}

function checkModerationApiSsot() {
  const source = readFile(moderationApiFile);
  if (!source) return;

  if (!source.includes("ADMIN_ROUTES.LISTINGS")) {
    failures.push("Moderation API must fetch list via ADMIN_ROUTES.LISTINGS.");
  }

  if (!source.includes("ADMIN_ROUTES.LISTING_COUNTS")) {
    failures.push("Moderation API must fetch counts via ADMIN_ROUTES.LISTING_COUNTS.");
  }

  if (/\/api\/v1\/admin\/ads/.test(source)) {
    failures.push("Moderation API must not call legacy /api/v1/admin/ads endpoints directly.");
  }
}

function checkModerationNormalizer() {
  const source = readFile(moderationNormalizerFile);
  if (!source) return;

  if (!/normalized !== "live"/.test(source)) {
    failures.push("Moderation normalizer must strictly validate canonical lifecycle statuses.");
  }

  if (/(['"])approved\1/.test(source) || /(['"])active\1/.test(source)) {
    failures.push("Moderation normalizer must not map legacy active/approved lifecycle aliases.");
  }
}

function checkAdSchemaGuard() {
  const source = readFile(adModelFile);
  if (!source) return;

  const schemaStart = source.indexOf("const AdSchema");
  const schemaSlice = schemaStart >= 0 ? source.slice(schemaStart) : source;

  if (!/\bsellerId\s*:\s*\{/.test(schemaSlice)) {
    failures.push("Ad schema must define canonical ownership field sellerId.");
  }

  if (/\buserId\s*:\s*\{/.test(schemaSlice)) {
    failures.push("Ad schema must not define listing ownership with userId.");
  }

  if (/^\s*(lat|lng)\s*:/m.test(schemaSlice)) {
    failures.push("Ad schema must not introduce flat lat/lng fields; use GeoJSON.");
  }

  const hasPointType =
    /coordinates\s*:\s*\{\s*type\s*:\s*\{\s*type\s*:\s*String\s*,\s*enum\s*:\s*\['Point'\]/s.test(
      schemaSlice
    );
  const hasCoordinateArray = /coordinates\s*:\s*\{\s*type\s*:\s*\[Number\]/s.test(schemaSlice);

  if (!hasPointType || !hasCoordinateArray) {
    failures.push(
      "Ad schema coordinates must remain GeoJSON Point with [longitude, latitude] array."
    );
  }
}

function main() {
  checkModerationApiSsot();
  checkModerationNormalizer();
  checkAdSchemaGuard();

  if (failures.length === 0) {
    console.log("✅ Ad SSOT guard passed.");
    return;
  }

  console.error("❌ Ad SSOT guard failed.");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  console.error("\n[HINT] Ad schema and moderation routes must follow canonical SSOT standards.");
  console.error("1. Ensure 'sellerId' is used for listing ownership, NOT 'userId'.");
  console.error("2. Moderation API MUST use ADMIN_ROUTES constants from @shared/contracts.");
  console.error("3. Coordinates MUST be GeoJSON Point [longitude, latitude].\n");
  process.exit(1);
}

main();
