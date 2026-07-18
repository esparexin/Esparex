/**
 * BUILDGRAPH-001 & Workspace Dependency Resolution Validator
 * Ensures that the NPM workspace dependency graph and the TypeScript
 * project reference graph are 100% synchronized and acyclic (DAG).
 *
 * BUILDGRAPH-002 — Execution Model Consistency Validator
 * Ensures that every composite project with project references has a
 * type-check strategy that guarantees referenced declaration outputs exist.
 * This prevents TS6305 errors where tsc --noEmit cannot resolve composite
 * project declarations because they were never emitted.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../../');

function loadJsonC(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        // Strip single line comments and multi-line comments for JSONC parsing
        content = content
            .replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => (g ? '' : m))
            .replace(/,\s*([\]}])/g, '$1'); // Strip trailing commas
        return JSON.parse(content);
    } catch {
        return null;
    }
}

function resolveWorkspaces() {
    const rootPkg = loadJsonC(path.join(ROOT_DIR, 'package.json'));
    if (!rootPkg || !rootPkg.workspaces) return [];

    const workspaces = [];
    for (const globPattern of rootPkg.workspaces) {
        if (globPattern.includes('*')) {
            const baseDir = path.join(ROOT_DIR, globPattern.replace(/\/\*$/, ''));
            if (fs.existsSync(baseDir)) {
                const subdirs = fs.readdirSync(baseDir);
                for (const sub of subdirs) {
                    const fullPath = path.join(baseDir, sub);
                    if (fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'package.json'))) {
                        workspaces.push(fullPath);
                    }
                }
            }
        } else {
            const fullPath = path.join(ROOT_DIR, globPattern);
            if (fs.existsSync(fullPath) && fs.existsSync(path.join(fullPath, 'package.json'))) {
                workspaces.push(fullPath);
            }
        }
    }
    return workspaces;
}

function runBuildGraphValidation() {
    const workspaceDirs = resolveWorkspaces();
    const packageMap = new Map(); // pkgName -> { dir, relDir, pkgJson, tsconfigJson }
    const errors = [];

    // Step 1: Map all packages
    for (const dir of workspaceDirs) {
        const pkgJson = loadJsonC(path.join(dir, 'package.json'));
        const tsconfigJson = loadJsonC(path.join(dir, 'tsconfig.json'));
        if (pkgJson && pkgJson.name) {
            const relDir = path.relative(ROOT_DIR, dir).replace(/\\/g, '/');
            packageMap.set(pkgJson.name, {
                dir,
                relDir,
                pkgJson,
                tsconfigJson
            });
        }
    }

    // Step 2: Validate BUILDGRAPH-001 for each workspace
    for (const [pkgName, pkgData] of packageMap.entries()) {
        const { pkgJson, tsconfigJson, relDir, dir } = pkgData;
        const allDeps = {
            ...pkgJson.dependencies,
            ...pkgJson.devDependencies,
            ...pkgJson.peerDependencies
        };

        const internalDeps = Object.keys(allDeps).filter(dep => packageMap.has(dep));

        if (!tsconfigJson) {
            errors.push(`[BUILDGRAPH-001] Package "${pkgName}" (${relDir}) is missing tsconfig.json`);
            continue;
        }

        const projectRefs = (tsconfigJson.references || []).map(ref => {
            const resolvedPath = path.resolve(dir, ref.path);
            return path.relative(ROOT_DIR, resolvedPath).replace(/\\/g, '/');
        });

        // Check if every internal npm dep has a project reference or path alias
        const paths = (tsconfigJson.compilerOptions && tsconfigJson.compilerOptions.paths) || {};

        for (const depPkgName of internalDeps) {
            const depData = packageMap.get(depPkgName);
            if (!depData) continue;

            const hasProjectReference = projectRefs.includes(depData.relDir);
            const hasPathAlias = Object.keys(paths).some(alias => alias === depPkgName || alias.startsWith(depPkgName + '/'));

            if (!hasProjectReference && !hasPathAlias) {
                errors.push(
                    `[BUILDGRAPH-001] Mismatch in "${pkgName}": depends on "${depPkgName}" in package.json, ` +
                    `but missing project reference {"path": "${path.relative(dir, depData.dir).replace(/\\/g, '/')}"} or path mapping in tsconfig.json`
                );
            }
        }
    }

    // Step 3: Cycle Detection (DAG Check)
    const visited = new Set();
    const recursionStack = new Set();

    function checkCycle(node, stack = []) {
        visited.add(node);
        recursionStack.add(node);
        stack.push(node);

        const pkgData = packageMap.get(node);
        if (pkgData) {
            const allDeps = {
                ...pkgData.pkgJson.dependencies,
                ...pkgData.pkgJson.devDependencies
            };
            const internalDeps = Object.keys(allDeps).filter(dep => packageMap.has(dep));
            for (const dep of internalDeps) {
                if (!visited.has(dep)) {
                    if (checkCycle(dep, stack)) return true;
                } else if (recursionStack.has(dep)) {
                    errors.push(`[DAG-CYCLE-001] Circular dependency detected in workspace graph: ${stack.join(' -> ')} -> ${dep}`);
                    return true;
                }
            }
        }

        recursionStack.delete(node);
        stack.pop();
        return false;
    }

    for (const pkgName of packageMap.keys()) {
        if (!visited.has(pkgName)) {
            checkCycle(pkgName);
        }
    }

    // Step 4: BUILDGRAPH-002 — Execution Model Consistency Check
    // Every composite project with project references must have a type-check
    // strategy that produces (or pre-builds) the declaration files its
    // referenced dependencies need.
    for (const [pkgName, pkgData] of packageMap.entries()) {
        const { pkgJson, tsconfigJson, relDir } = pkgData;
        if (!tsconfigJson) continue;

        const isComposite = tsconfigJson.compilerOptions && tsconfigJson.compilerOptions.composite === true;
        const hasReferences = tsconfigJson.references && tsconfigJson.references.length > 0;
        const typeCheckScript = (pkgJson.scripts && pkgJson.scripts['type-check']) || '';

        if (isComposite && hasReferences) {
            // Composite packages with references must NOT use bare tsc --noEmit
            // because tsc --noEmit suppresses all declaration output, making
            // downstream composite references unresolvable (TS6305).
            const isBareNoEmit = /^tsc\s+--noEmit\s*$/.test(typeCheckScript.trim());

            if (isBareNoEmit) {
                errors.push(
                    `[BUILDGRAPH-002] Execution model mismatch in "${pkgName}" (${relDir}): ` +
                    `package is composite with project references but type-check script ` +
                    `is bare "tsc --noEmit". Composite references require declaration outputs. ` +
                    `Use "npm run build -w <dependency> && tsc --noEmit" or "tsc -b --noEmit" instead.`
                );
            }
        }
    }

    return {
        success: errors.length === 0,
        errors,
        packagesCount: packageMap.size
    };
}

if (require.main === module) {
    console.log('Running BUILDGRAPH-001 Workspace Dependency Validator...');
    const result = runBuildGraphValidation();
    if (result.success) {
        console.log(`✓ PASS: All ${result.packagesCount} workspace packages have synchronized dependency & project reference graphs.`);
        process.exit(0);
    } else {
        console.error(`✗ FAIL: ${result.errors.length} build graph issue(s) found:\n`);
        result.errors.forEach(err => console.error(`  - ${err}`));
        process.exit(1);
    }
}

module.exports = { runBuildGraphValidation };
