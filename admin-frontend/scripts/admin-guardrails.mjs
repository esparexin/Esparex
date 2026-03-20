import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const srcRoot = path.join(projectRoot, "src");
const protectedRoot = path.join(srcRoot, "app", "(protected)");
const hooksRoot = path.join(srcRoot, "hooks");
const dataTablePath = path.join(srcRoot, "components", "ui", "DataTable.tsx");
const routesPath = path.join(srcRoot, "lib", "api", "routes.ts");

const violations = [];
const warnings = [];

function walk(dir, files = []) {
    if (!fs.existsSync(dir)) return files;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(fullPath, files);
        } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
            files.push(fullPath);
        }
    }
    return files;
}

function rel(filePath) {
    return path.relative(projectRoot, filePath).replaceAll(path.sep, "/");
}

function checkDataTableHooks() {
    if (!fs.existsSync(dataTablePath)) {
        violations.push("Missing DataTable.tsx guard target.");
        return;
    }
    const content = fs.readFileSync(dataTablePath, "utf8");
    const earlyReturnIndex = content.indexOf("if (isLoading)");
    const firstHookIndex = Math.min(
        ...["useRef(", "useState(", "useMemo(", "useEffect(", "useVirtualizer("]
            .map((token) => content.indexOf(token))
            .filter((idx) => idx >= 0)
    );
    if (earlyReturnIndex >= 0 && firstHookIndex >= 0 && earlyReturnIndex < firstHookIndex) {
        violations.push(
            `Hook-order violation risk in ${rel(dataTablePath)}: early loading return appears before hooks.`
        );
    }
}

function checkRawAdminPaths() {
    const files = [...walk(protectedRoot), ...walk(hooksRoot)];
    for (const file of files) {
        const content = fs.readFileSync(file, "utf8");
        const matches = content.match(/["']\/admin\/[^"']*["']/g);
        if (matches && matches.length > 0) {
            violations.push(
                `Raw "/admin/" path literal found in ${rel(file)}: ${matches.join(", ")}`
            );
        }
    }
}

function checkAdminFetchLiteralPaths() {
    const files = walk(protectedRoot);
    const pattern = /adminFetch(?:<[^>]+>)?\(\s*["'`](\/[^"'`]+)["'`]/g;
    for (const file of files) {
        const content = fs.readFileSync(file, "utf8");
        let match;
        while ((match = pattern.exec(content)) !== null) {
            violations.push(
                `adminFetch must use route registry constants in ${rel(file)}: ${match[0]}`
            );
        }
    }
}

function checkUnusedAdminRouteConstants() {
    if (!fs.existsSync(routesPath)) {
        warnings.push("Missing routes.ts; skipping unused constant detection.");
        return;
    }
    const routesContent = fs.readFileSync(routesPath, "utf8");
    const constantNames = Array.from(routesContent.matchAll(/\s([A-Z0-9_]+):/g)).map((m) => m[1]);
    const usageFiles = walk(srcRoot).filter((file) => file !== routesPath);
    const usageText = usageFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");
    for (const name of constantNames) {
        const useCount = (usageText.match(new RegExp(`ADMIN_ROUTES\\.${name}\\b`, "g")) || []).length;
        if (useCount === 0) {
            warnings.push(`Unused ADMIN_ROUTES constant: ${name}`);
        }
    }
}

checkDataTableHooks();
checkRawAdminPaths();
checkAdminFetchLiteralPaths();
checkUnusedAdminRouteConstants();

if (warnings.length > 0) {
    console.warn("Guardrail warnings:");
    for (const warning of warnings) {
        console.warn(`- ${warning}`);
    }
}

if (violations.length > 0) {
    console.error("Guardrail violations:");
    for (const violation of violations) {
        console.error(`- ${violation}`);
    }
    process.exit(1);
}

console.log("Admin guardrails passed.");
