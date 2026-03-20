const fs = require('fs');
const path = require('path');

/**
 * guard-route-shadowing.js
 * Enforces "Static > Query > Action > Parameterized" route hierarchy.
 * Fails if a parameterized route (e.g., /:id) is defined before a static/query route (e.g., /summary)
 * that shares the same base path.
 */

const ROUTES_DIR = path.join(__dirname, '../backend/src/routes');
const STATIC_PATTERNS = ['/summary', '/stats', '/analytics', '/export', '/search', '/metrics', '/health', '/rules', '/keywords'];

function getFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        if (item.isDirectory()) {
            files.push(...getFiles(path.join(dir, item.name)));
        } else if (item.name.endsWith('.routes.ts')) {
            files.push(path.join(dir, item.name));
        }
    }
    return files;
}

let hasError = false;

const routeFiles = getFiles(ROUTES_DIR);

routeFiles.forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Track parameterized routes found so far
    // Key: Base Path (e.g., "/ads"), Value: Line Number
    const parameterizedRoutes = new Map();

    lines.forEach((line, index) => {
        const lineNum = index + 1;
        
        // Simple regex to find router methods with paths
        const match = line.match(/\.((?:get|post|put|patch|delete))\s*\(\s*['"]([^'"]+)['"]/);
        if (!match) return;

        const method = match[1].toUpperCase();
        const routePath = match[2];

        // Check if this is a parameterized route
        if (routePath.includes('/:')) {
            const segments = routePath.split('/');
            const firstParamIndex = segments.findIndex(s => s.startsWith(':'));
            const basePath = segments.slice(0, firstParamIndex).join('/') || '/';
            
            if (!parameterizedRoutes.has(basePath)) {
                parameterizedRoutes.set(basePath, { method, path: routePath, line: lineNum });
            }
        } else {
            // Check if this static route is shadowed by a previously seen parameterized route
            parameterizedRoutes.forEach((paramInfo, basePath) => {
                // If the static route starts with the base path of a parameter route
                // AND it's a "known" static pattern that is likely to be shadowed
                if (routePath.startsWith(basePath) && STATIC_PATTERNS.some(p => routePath.endsWith(p))) {
                    // Only error if they share segments up to the parameter
                    // e.g. /ads/:id shadows /ads/summary
                    const paramSegments = paramInfo.path.split('/');
                    const staticSegments = routePath.split('/');
                    
                    // Find first param in paramSegments
                    const pIdx = paramSegments.findIndex(s => s.startsWith(':'));
                    
                    // Compare segments before pIdx
                    const matchPrefix = paramSegments.slice(0, pIdx).every((s, i) => s === staticSegments[i]);
                    
                    if (matchPrefix && lineNum > paramInfo.line) {
                        console.error(`\x1b[31m[ERROR]\x1b[0m Route Hierarchy Violation in ${path.relative(process.cwd(), filePath)}:${lineNum}`);
                        console.error(`   Static route "${method} ${routePath}" is shadowed by parameterized route "${paramInfo.method} ${paramInfo.path}" (line ${paramInfo.line}).`);
                        console.error(`   Fix: Move the static route ABOVE the parameterized one.\n`);
                        hasError = true;
                    }
                }
            });
        }
    });
});

if (hasError) {
    console.error(`\x1b[31m[FAILED]\x1b[0m Express Route Hierarchy Law violation(s) detected.`);
    process.exit(1);
} else {
    console.log(`\x1b[32m[PASSED]\x1b[0m All route hierarchies comply with the "Static > Parameterized" law.`);
}
