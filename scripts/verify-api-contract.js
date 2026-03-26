#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const frontendRoutesFile = path.join(repoRoot, "frontend/src/api/routes.ts");
const backendAppFile = path.join(repoRoot, "backend/src/app.ts");

const METHOD_REGEX =
  /\b([A-Za-z_$][A-Za-z0-9_$]*)\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/g;
const SUBROUTER_REGEX =
  /\b([A-Za-z_$][A-Za-z0-9_$]*)\.use\(\s*['"`]([^'"`]+)['"`]\s*,\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\)/g;

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function parseArgs() {
  const scopeArg = process.argv.find((arg) => arg.startsWith("--scope="));
  const scope = scopeArg ? scopeArg.split("=")[1] : "both";
  if (!["user", "admin", "both"].includes(scope)) {
    throw new Error(`Invalid --scope value: ${scope}`);
  }
  return { scope };
}

function extractBlock(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  if (start === -1) {
    throw new Error(`Unable to locate block marker: ${startMarker}`);
  }

  const end = endMarker ? source.indexOf(endMarker, start) : source.lastIndexOf("} as const");
  if (end === -1) {
    throw new Error(`Unable to locate end marker for block: ${startMarker}`);
  }

  return source.slice(start, end);
}

function extractStaticConstants(block) {
  const constants = [];
  const regex = /^\s*([A-Z0-9_]+)\s*:\s*"([^"]+)"\s*,?\s*$/gm;

  let match = regex.exec(block);
  while (match) {
    constants.push({ key: match[1], path: match[2] });
    match = regex.exec(block);
  }

  return constants;
}

function normalizeInterpolatedPath(rawPath) {
  // Replace simple template placeholders with dynamic segment markers
  return rawPath.replace(/\$\{[^{}]*\}/g, ":param");
}

function extractFunctionConstants(block) {
  const constants = [];
  const fnRegex =
    /([A-Z0-9_]+)\s*:\s*\([^)]*\)\s*=>\s*(`[\s\S]*?`|'[^']*'|"[^"]*")\s*,/g;

  let match = fnRegex.exec(block);
  while (match) {
    const key = match[1];
    const rawLiteral = match[2];
    const unwrapped = rawLiteral.slice(1, -1);
    constants.push({ key, path: normalizeInterpolatedPath(unwrapped) });
    match = fnRegex.exec(block);
  }

  return constants;
}

function extractRouteModuleImports(source, relativeToDir) {
  const imports = new Map();
  const importRegex = /import\s+([^;]+?)\s+from\s+['"]([^'"]+)['"]/g;

  let match = importRegex.exec(source);
  while (match) {
    const spec = match[1].trim();
    const importPath = match[2];

    if (!importPath.startsWith("./")) {
      match = importRegex.exec(source);
      continue;
    }

    const resolvedFile = path.resolve(
      relativeToDir,
      importPath.endsWith(".ts") ? importPath : `${importPath}.ts`
    );

    if (spec.startsWith("{")) {
      const named = spec.replace(/^\{|\}$/g, "").split(",");
      for (const item of named) {
        const trimmed = item.trim();
        if (!trimmed) continue;
        const parts = trimmed.split(/\s+as\s+/);
        const localName = (parts[1] || parts[0]).trim();
        imports.set(localName, resolvedFile);
      }
      match = importRegex.exec(source);
      continue;
    }

    const [defaultImport] = spec.split(",");
    if (defaultImport && !defaultImport.includes("{")) {
      imports.set(defaultImport.trim(), resolvedFile);
    }

    const namedMatch = spec.match(/\{([^}]+)\}/);
    if (namedMatch) {
      const named = namedMatch[1].split(",");
      for (const item of named) {
        const trimmed = item.trim();
        if (!trimmed) continue;
        const parts = trimmed.split(/\s+as\s+/);
        const localName = (parts[1] || parts[0]).trim();
        imports.set(localName, resolvedFile);
      }
    }

    match = importRegex.exec(source);
  }

  return imports;
}

function joinPaths(base, segment) {
  const normalizedBase = base === "/" ? "" : base.replace(/\/+$/, "");
  const normalizedSegment = segment === "/" ? "" : segment.replace(/^\/+/, "");
  const joined = `/${[normalizedBase.replace(/^\/+/, ""), normalizedSegment]
    .filter(Boolean)
    .join("/")}`;
  return joined === "" ? "/" : joined;
}

function toRegex(pattern) {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const withParams = escaped.replace(/:[A-Za-z0-9_]+/g, "[^/]+");
  return new RegExp(`^${withParams}$`);
}

function normalizeRoutePath(routePath, namespace) {
  const [pathOnly] = routePath.split("?");
  const withLeadingSlash = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;
  const normalized = withLeadingSlash.replace(/\/+$/, "") || "/";

  if (namespace === "user") {
    return normalized;
  }
  return normalized;
}

function collectPatternsFromRouteFile(routeFilePath, mountPrefix, visited) {
  const key = `${routeFilePath}::${mountPrefix}`;
  if (visited.has(key)) return [];
  visited.add(key);

  if (!fs.existsSync(routeFilePath)) return [];

  const source = read(routeFilePath);
  const fileDir = path.dirname(routeFilePath);
  const imports = extractRouteModuleImports(source, fileDir);

  const patterns = [{ method: "ANY", pattern: mountPrefix }];

  let methodMatch = METHOD_REGEX.exec(source);
  while (methodMatch) {
    const routePath = methodMatch[3];
    patterns.push({
      method: methodMatch[2].toUpperCase(),
      pattern: routePath === "/" ? mountPrefix : joinPaths(mountPrefix, routePath),
    });
    methodMatch = METHOD_REGEX.exec(source);
  }
  METHOD_REGEX.lastIndex = 0;

  let subrouterMatch = SUBROUTER_REGEX.exec(source);
  while (subrouterMatch) {
    const childMountPath = subrouterMatch[2];
    const childModule = subrouterMatch[3];
    const childFile = imports.get(childModule);

    if (childFile) {
      const childPrefix =
        childMountPath === "/" ? mountPrefix : joinPaths(mountPrefix, childMountPath);
      patterns.push(
        ...collectPatternsFromRouteFile(childFile, childPrefix, visited)
      );
    }

    subrouterMatch = SUBROUTER_REGEX.exec(source);
  }
  SUBROUTER_REGEX.lastIndex = 0;

  return patterns;
}

function extractMountedPatterns(appSource, namespaceBase) {
  const appDir = path.dirname(backendAppFile);
  const imports = extractRouteModuleImports(appSource, appDir);

  const mountRegex =
    /app\.use\(\s*['"]([^'"]+)['"]\s*,\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\)/g;
  const mounts = [];

  let match = mountRegex.exec(appSource);
  while (match) {
    const mountedPath = match[1];
    const moduleName = match[2];

    if (!mountedPath.startsWith(namespaceBase)) {
      match = mountRegex.exec(appSource);
      continue;
    }

    const localPrefix = mountedPath.slice(namespaceBase.length) || "/";
    const routeFilePath = imports.get(moduleName);
    if (routeFilePath) {
      mounts.push({ localPrefix, routeFilePath });
    }

    match = mountRegex.exec(appSource);
  }

  const patterns = [];
  const visited = new Set();
  for (const mount of mounts) {
    patterns.push(
      ...collectPatternsFromRouteFile(mount.routeFilePath, normalizeRoutePath(mount.localPrefix), visited)
    );
  }

  return patterns.map((entry) => ({ ...entry, regex: toRegex(entry.pattern) }));
}

function checkScope(groupName, constants, backendPatterns) {
  const failures = [];

  for (const constant of constants) {
    const normalizedPath = normalizeRoutePath(constant.path);
    const matched = backendPatterns.some((pattern) =>
      pattern.regex.test(normalizedPath)
    );

    if (!matched) {
      failures.push({
        key: constant.key,
        rawPath: constant.path,
        normalizedPath,
      });
    }
  }

  return {
    groupName,
    checked: constants.length,
    failures,
  };
}

function printReport(reports) {
  let hasFailures = false;

  for (const report of reports) {
    if (report.failures.length > 0) {
      hasFailures = true;
      console.error(`❌ ${report.groupName} API contract drift detected.`);
      for (const failure of report.failures) {
        console.error(
          ` - API_ROUTES.${report.groupName}.${failure.key} = "${failure.rawPath}" (normalized: ${failure.normalizedPath}) is not mounted in backend`
        );
      }
      console.error(
        `Checked ${report.checked} ${report.groupName} route keys, failed ${report.failures.length}.`
      );
      console.error(`\n[HINT] The frontend ${report.groupName}_ROUTES constant has drifted from the backend implementation.`);
      console.error("1. Check if the route is actually mounted in 'backend/src/app.ts' or relevant sub-routers.");
      console.error("2. Ensure the path string in the frontend contract exactly matches the backend path.");
      console.error("3. If this is a new route, verify it is properly versioned under /api/v1/.\n");
    } else {
      console.log(
        `✅ ${report.groupName} API contract check passed. Checked ${report.checked} ${report.groupName} route keys.`
      );
    }
  }

  if (hasFailures) {
    process.exit(1);
  }
}

function main() {
  const { scope } = parseArgs();

  const appSource = read(backendAppFile);
  
  // SSOT: Routes are now managed in the shared module
  const userSource = read(path.join(repoRoot, "shared/contracts/api/userRoutes.ts"));
  const adminSource = read(path.join(repoRoot, "shared/contracts/api/adminRoutes.ts"));

  const userBlock = extractBlock(userSource, "export const USER_ROUTES = {", "} as const;");
  const adminBlock = extractBlock(adminSource, "export const ADMIN_ROUTES = {", "} as const;");

  const userConstants = [
    ...extractStaticConstants(userBlock),
    ...extractFunctionConstants(userBlock),
  ];
  const adminConstants = [
    ...extractStaticConstants(adminBlock),
    ...extractFunctionConstants(adminBlock),
  ];

  const userPatterns = extractMountedPatterns(appSource, "/api/v1");
  const adminPatterns = extractMountedPatterns(appSource, "/api/v1/admin");

  const reports = [];

  if (scope === "user" || scope === "both") {
    reports.push(checkScope("USER", userConstants, userPatterns));
  }
  if (scope === "admin" || scope === "both") {
    reports.push(checkScope("ADMIN", adminConstants, adminPatterns));
  }

  printReport(reports);
}

main();
