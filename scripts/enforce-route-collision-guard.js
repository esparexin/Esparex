#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const frontendAppRoot = path.join(repoRoot, "frontend", "src", "app");
const backendAppFile = path.join(repoRoot, "backend", "src", "app.ts");

const RESERVED_STATIC_SEGMENTS = new Set([
  "create",
  "new",
  "edit",
  "admin",
  "api",
  "login",
  "register",
  "search",
  "settings",
  "me",
]);

const GUARDED_DYNAMIC_PARENTS = new Set([
  "/ads",
  "/business",
  "/services",
  "/brands",
  "/models",
  "/spare-parts",
  "/category",
]);

// Legacy collisions acknowledged for backwards compatibility until route migration is complete.
const RESERVED_COLLISION_ALLOWLIST = new Set(["/business::edit"]);

const pageOrRoutePattern = /^(page|route)\.(t|j)sx?$/;
const dynamicSegmentPattern = /^\[[^\]]+\]$/;
const catchAllPattern = /^\[\.\.\.[^\]]+\]$/;
const optionalCatchAllPattern = /^\[\[\.\.\.[^\]]+\]\]$/;

function exists(filePath) {
  return fs.existsSync(filePath);
}

function isRouteGroup(segment) {
  return segment.startsWith("(") && segment.endsWith(")");
}

function isParallelSegment(segment) {
  return segment.startsWith("@");
}

function isDynamicSegment(segment) {
  return dynamicSegmentPattern.test(segment);
}

function toCanonicalSegment(segment) {
  if (optionalCatchAllPattern.test(segment)) return "[[...param]]";
  if (catchAllPattern.test(segment)) return "[...param]";
  if (dynamicSegmentPattern.test(segment)) return "[param]";
  return segment;
}

function normalizeSegments(segments) {
  return segments.filter(
    (segment) => !isRouteGroup(segment) && !isParallelSegment(segment)
  );
}

function toDisplayPath(segments) {
  if (!segments.length) return "/";
  return `/${segments.join("/")}`;
}

function collectFrontendRoutes(rootDir) {
  const routes = [];

  function walk(currentDir, relativeSegments) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    const routeFiles = entries
      .filter((entry) => entry.isFile() && pageOrRoutePattern.test(entry.name))
      .map((entry) => entry.name);

    for (const fileName of routeFiles) {
      routes.push({
        segments: normalizeSegments(relativeSegments),
        sourceFile: path.relative(repoRoot, path.join(currentDir, fileName)),
      });
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      walk(path.join(currentDir, entry.name), [...relativeSegments, entry.name]);
    }
  }

  walk(rootDir, []);
  return routes;
}

function findFrontendDuplicateRoutes(routes) {
  const routeMap = new Map();
  const duplicates = [];

  for (const route of routes) {
    const canonicalPath = toDisplayPath(route.segments.map(toCanonicalSegment));
    const existing = routeMap.get(canonicalPath) || [];
    existing.push(route.sourceFile);
    routeMap.set(canonicalPath, existing);
  }

  for (const [canonicalPath, files] of routeMap.entries()) {
    if (files.length < 2) continue;
    duplicates.push({ canonicalPath, files });
  }

  return duplicates;
}

function findFrontendDynamicStaticRisks(routes) {
  const siblingMap = new Map();
  const risks = [];
  const allowlistedRisks = [];

  for (const route of routes) {
    if (!route.segments.length) continue;
    const parentSegments = route.segments.slice(0, -1);
    const leaf = route.segments[route.segments.length - 1];
    const parentPath = toDisplayPath(parentSegments);

    const current = siblingMap.get(parentPath) || {
      dynamicChildren: new Set(),
      staticChildren: new Set(),
    };

    if (isDynamicSegment(leaf)) {
      current.dynamicChildren.add(leaf);
    } else {
      current.staticChildren.add(leaf);
    }

    siblingMap.set(parentPath, current);
  }

  for (const [parentPath, entry] of siblingMap.entries()) {
    if (entry.dynamicChildren.size === 0) continue;
    if (!GUARDED_DYNAMIC_PARENTS.has(parentPath)) continue;

    const riskyStatics = [...entry.staticChildren].filter((segment) =>
      RESERVED_STATIC_SEGMENTS.has(segment)
    );

    if (riskyStatics.length === 0) continue;

    const blockingStatics = riskyStatics.filter(
      (segment) => !RESERVED_COLLISION_ALLOWLIST.has(`${parentPath}::${segment}`)
    );
    const ignoredStatics = riskyStatics.filter((segment) =>
      RESERVED_COLLISION_ALLOWLIST.has(`${parentPath}::${segment}`)
    );

    if (ignoredStatics.length > 0) {
      allowlistedRisks.push({
        parentPath,
        dynamicChildren: [...entry.dynamicChildren],
        riskyStatics: ignoredStatics,
      });
    }

    if (blockingStatics.length === 0) continue;

    risks.push({
      parentPath,
      dynamicChildren: [...entry.dynamicChildren],
      riskyStatics: blockingStatics,
    });
  }

  return { risks, allowlistedRisks };
}

function findBackendMountDuplicates() {
  if (!exists(backendAppFile)) return [];

  const source = fs.readFileSync(backendAppFile, "utf8");
  const mountRegex =
    /app\.use\(\s*['"`]([^'"`]+)['"`]\s*,\s*([A-Za-z_$][A-Za-z0-9_$]*)/g;
  const mounts = new Map();
  const duplicates = [];

  let match = mountRegex.exec(source);
  while (match) {
    const mountPath = match[1];
    const mountTarget = match[2];
    if (!mountPath.startsWith("/api/")) {
      match = mountRegex.exec(source);
      continue;
    }

    const mountKey = `${mountPath}::${mountTarget}`;
    const count = mounts.get(mountKey) || 0;
    mounts.set(mountKey, count + 1);
    match = mountRegex.exec(source);
  }

  for (const [mountKey, count] of mounts.entries()) {
    if (count > 1) {
      const [mountPath, mountTarget] = mountKey.split("::");
      duplicates.push({ mountPath, mountTarget, count });
    }
  }

  return duplicates;
}

function main() {
  if (!exists(frontendAppRoot)) {
    console.error("❌ Missing frontend app directory: frontend/src/app");
    process.exit(1);
  }

  const frontendRoutes = collectFrontendRoutes(frontendAppRoot);
  const frontendDuplicates = findFrontendDuplicateRoutes(frontendRoutes);
  const { risks: frontendRisks, allowlistedRisks } = findFrontendDynamicStaticRisks(frontendRoutes);
  const backendMountDuplicates = findBackendMountDuplicates();

  if (
    frontendDuplicates.length === 0 &&
    frontendRisks.length === 0 &&
    backendMountDuplicates.length === 0
  ) {
    console.log("✅ Route collision guard passed.");
    return;
  }

  console.error("❌ Route collision guard failed.");

  if (frontendDuplicates.length > 0) {
    console.error("\nFrontend duplicate route patterns:");
    for (const duplicate of frontendDuplicates) {
      console.error(`- ${duplicate.canonicalPath}`);
      for (const file of duplicate.files) {
        console.error(`  - ${file}`);
      }
    }
  }

  if (frontendRisks.length > 0) {
    console.error("\nFrontend dynamic/static reserved collisions:");
    for (const risk of frontendRisks) {
      console.error(
        `- ${risk.parentPath}: dynamic [${risk.dynamicChildren.join(
          ", "
        )}] conflicts with reserved static [${risk.riskyStatics.join(", ")}]`
      );
    }
  }

  if (allowlistedRisks.length > 0) {
    console.warn("\nFrontend reserved collisions (allowlisted legacy):");
    for (const risk of allowlistedRisks) {
      console.warn(
        `- ${risk.parentPath}: dynamic [${risk.dynamicChildren.join(
          ", "
        )}] overlaps allowlisted static [${risk.riskyStatics.join(", ")}]`
      );
    }
  }

  if (backendMountDuplicates.length > 0) {
    console.error("\nBackend duplicate API mount paths:");
    for (const duplicate of backendMountDuplicates) {
      console.error(
        `- ${duplicate.mountPath} with ${duplicate.mountTarget} (declared ${duplicate.count} times)`
      );
    }
  }

  process.exit(1);
}

main();
