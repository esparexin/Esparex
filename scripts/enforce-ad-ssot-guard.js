#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const moderationApiFile = path.join(
  repoRoot,
  "apps/admin",
  "src",
  "lib",
  "api",
  "moderation.ts"
);
const moderationNormalizerFile = path.join(
  repoRoot,
  "apps/admin",
  "src",
  "components",
  "moderation",
  "normalizeModerationAd.ts"
);
const adModelFile = path.join(repoRoot, "core", "src", "models", "Ad.ts");
const modelsDir = path.join(repoRoot, "core", "src", "models");
const feedVisibilityGuardFile = path.join(
  repoRoot,
  "core",
  "src",
  "utils",
  "FeedVisibilityGuard.ts"
);
const uiSrcRoots = ["apps/web/src", "apps/admin/src", "apps/mobile/src", "packages/ui/src", "packages/mobile-ui/src"];

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

  // 2dsphere index check — must exist on location.coordinates
  const has2dsphereIndex =
    /\.index\s*\(\s*\{\s*['"]location\.coordinates['"]\s*:\s*['"]2dsphere['"]\s*\}/s.test(source);

  if (!has2dsphereIndex) {
    failures.push(
      "Ad model must define a 2dsphere index on location.coordinates (e.g. AdSchema.index({ 'location.coordinates': '2dsphere' }))."
    );
  }
}

function checkMongooseConnectionBinding() {
  // AGENTS.md: models in core/src/models/ must bind via getUserConnection() /
  // getAdminConnection(). Direct mongoose.model() bypasses the tenant pool.
  if (!fs.existsSync(modelsDir)) {
    failures.push("Missing required directory: core/src/models");
    return;
  }
  const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith(".ts"));
  for (const file of files) {
    const source = fs.readFileSync(path.join(modelsDir, file), "utf8");
    const stripped = source
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    if (/mongoose\s*\.\s*model\s*\(/.test(stripped) || /mongoose\s*\.\s*models\b/.test(stripped)) {
      failures.push(
        `Model core/src/models/${file} must bind via getUserConnection()/getAdminConnection() (bare mongoose.model() forbidden).`
      );
    }
  }
}

function checkAdExpiryClamp() {
  // AGENTS.md 30-day hard expiry ceiling: live listings must always carry a
  // future expiresAt assigned/clamped in the model pre-save hook.
  const source = readFile(adModelFile);
  if (!source) return;
  if (!/\.pre\s*\(\s*['"]save['"]/.test(source) || !/this\.expiresAt\s*=/.test(source)) {
    failures.push("Ad model must assign/clamp expiresAt in a pre('save') hook (30-day expiry ceiling).");
  }
}

function checkFeedFilterSsot() {
  // AGENTS.md zero-unbounded-feed-queries: public feed queries must go through
  // buildPublicAdFilter() from @esparex/core FeedVisibilityGuard.
  const source = readFile(feedVisibilityGuardFile);
  if (!source) return;
  if (!/export\s+(const|function)\s+buildPublicAdFilter/.test(source)) {
    failures.push("FeedVisibilityGuard must export buildPublicAdFilter (public feed filter SSOT).");
  }
}

function checkDateFormatterSsot() {
  // AGENTS.md deterministic date formatter SSOT: UI must not use raw
  // toLocaleDateString(); use formatAppDate/formatStableDate/formatDate.
  const hits = [];
  const walk = (dir) => {
    const abs = path.join(repoRoot, dir);
    if (!fs.existsSync(abs)) return;
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name.startsWith(".")) continue;
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(rel);
      } else if (/\.(ts|tsx)$/.test(entry.name) && !/(__tests__|\.spec\.|\.test\.)/.test(rel)) {
        const content = fs.readFileSync(path.join(repoRoot, rel), "utf8");
        if (/\.toLocaleDateString\s*\(/.test(content)) hits.push(rel);
      }
    }
  };
  for (const root of uiSrcRoots) walk(root);
  for (const hit of hits) {
    failures.push(`${hit} must not use raw toLocaleDateString() (use formatAppDate/formatStableDate/formatDate).`);
  }
}

function main() {
  checkModerationApiSsot();
  checkModerationNormalizer();
  checkAdSchemaGuard(); // includes 2dsphere index verification
  checkMongooseConnectionBinding(); // AGENTS.md Mongoose dual-connection rule
  checkAdExpiryClamp(); // AGENTS.md 30-day expiry ceiling
  checkFeedFilterSsot(); // AGENTS.md zero-unbounded-feed-query rule
  checkDateFormatterSsot(); // AGENTS.md deterministic date formatter SSOT

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
  console.error("3. Coordinates MUST be GeoJSON Point [longitude, latitude].");
  console.error("4. Ad model MUST define AdSchema.index({ 'location.coordinates': '2dsphere' }).\n");
  process.exit(1);
}

main();
