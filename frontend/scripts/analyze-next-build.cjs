#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();
const nextDir = path.join(projectRoot, ".next");
const buildManifestPath = path.join(nextDir, "build-manifest.json");
const reactLoadableManifestPath = path.join(nextDir, "react-loadable-manifest.json");
const staticChunksDir = path.join(nextDir, "static", "chunks");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function toKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function safeStat(relativeAssetPath) {
  const filePath = path.join(nextDir, relativeAssetPath);
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

function listAppRouteChunks(dir, result = []) {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listAppRouteChunks(fullPath, result);
      continue;
    }
    if (!entry.name.endsWith(".js")) continue;
    const normalized = fullPath.replace(`${nextDir}${path.sep}`, "").split(path.sep).join("/");
    if (normalized.includes("/page-") || normalized.includes("/layout-")) {
      result.push(normalized);
    }
  }
  return result;
}

function routeLabelFromChunk(chunkPath) {
  const normalized = chunkPath
    .replace(/^static\/chunks\/app\//, "")
    .replace(/\/page-[^/]+\.js$/, "")
    .replace(/\/layout-[^/]+\.js$/, "")
    .replace(/^\((public|private|auth)\)\//, "")
    .replace(/\/\((public|private|auth)\)\//g, "/")
    .replace(/^\((public|private|auth)\)$/, "");
  return normalized || "/";
}

function printSection(title) {
  console.log(`\n${title}`);
  console.log("-".repeat(title.length));
}

if (!fs.existsSync(buildManifestPath)) {
  console.error("Missing .next/build-manifest.json. Run a production build first.");
  process.exit(1);
}

const buildManifest = readJson(buildManifestPath);
const reactLoadableManifest = fs.existsSync(reactLoadableManifestPath)
  ? readJson(reactLoadableManifestPath)
  : {};

const rootMainFiles = Array.isArray(buildManifest.rootMainFiles) ? buildManifest.rootMainFiles : [];
const rootMainTotal = rootMainFiles.reduce((sum, file) => sum + safeStat(file), 0);

const appRouteChunks = listAppRouteChunks(staticChunksDir)
  .map((chunk) => ({
    file: chunk,
    route: routeLabelFromChunk(chunk),
    size: safeStat(chunk),
  }))
  .sort((a, b) => b.size - a.size);

const uniqueLargestRoutes = [];
const seenRoutes = new Set();
for (const chunk of appRouteChunks) {
  if (seenRoutes.has(chunk.route)) continue;
  seenRoutes.add(chunk.route);
  uniqueLargestRoutes.push(chunk);
}

const dynamicEntries = Object.entries(reactLoadableManifest)
  .map(([key, value]) => {
    const files = Array.isArray(value?.files) ? value.files : [];
    const total = files.reduce((sum, file) => sum + safeStat(file), 0);
    return { key, total, files };
  })
  .sort((a, b) => b.total - a.total);

console.log("Esparex Next Build Analysis");
console.log("===========================");
console.log(`Build directory: ${nextDir}`);

printSection("Root Main Files");
for (const file of rootMainFiles) {
  console.log(`${toKB(safeStat(file)).padStart(10)}  ${file}`);
}
console.log(`${toKB(rootMainTotal).padStart(10)}  total root JS`);

printSection("Largest App Route Chunks");
for (const chunk of uniqueLargestRoutes.slice(0, 15)) {
  console.log(`${toKB(chunk.size).padStart(10)}  ${chunk.route}  (${chunk.file})`);
}

printSection("Largest Dynamic Chunks");
for (const entry of dynamicEntries.slice(0, 15)) {
  console.log(`${toKB(entry.total).padStart(10)}  ${entry.key}`);
}

const hotspotRoutes = ["/", "search", "browse-services", "ads/[slug]", "services/[slug]", "post-ad"];
printSection("Target Route Summary");
for (const hotspot of hotspotRoutes) {
  const match = uniqueLargestRoutes.find((item) => item.route === hotspot);
  if (match) {
    console.log(`${toKB(match.size).padStart(10)}  ${hotspot}`);
  } else {
    console.log(`${"n/a".padStart(10)}  ${hotspot}`);
  }
}
