const fs = require('fs');
const path = require('path');

/**
 * 🛡️ ESPAREX API SAFETY GUARD
 * Detects patterns likely to cause runtime errors or hydration mismatches.
 */

const UNSAFE_PATTERNS = [
    {
        name: "Direct .data access",
        regex: /\.get<.*>\(.*\)\.data/g,
        message: "Directly accessing .data on apiClient.get is risky. Wrap in safeApi() instead."
    },
    {
        name: "Direct .output access",
        regex: /\.get<.*>\(.*\)\.output/g,
        message: "Directly accessing .output on apiClient.get is risky. Wrap in safeApi() instead."
    },
    {
        name: "Unguarded map() on API result",
        regex: /await apiClient\.get.*\)\.map\(/g,
        message: "Cannot call .map() directly on a Promise return. Use safeApi() to handle null/undefined results safely."
    }
];

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let violations = [];

    UNSAFE_PATTERNS.forEach(pattern => {
        const matches = content.match(pattern.regex);
        if (matches) {
            violations.push(`${pattern.name}: ${pattern.message}`);
        }
    });

    return violations;
}

// Simple CLI runner
const target = process.argv[2] || 'src';
const fullPath = path.resolve(process.env.PWD, target);

console.log(`🛡️ Scanning for API Safety Violations in: ${target}...`);

// Recursively find files (simplified for script demo)
function scanDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory()) {
            if (!p.includes('node_modules') && !p.includes('.git')) {
                scanDir(p);
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const v = checkFile(p);
            if (v.length > 0) {
                console.warn(`⚠️ [Violation] ${p}:`);
                v.forEach(msg => console.warn(`   - ${msg}`));
            }
        }
    });
}

try {
    scanDir(fullPath);
    console.log("✅ Scan complete.");
} catch (e) {
    console.error("❌ Scan failed:", e.message);
}
