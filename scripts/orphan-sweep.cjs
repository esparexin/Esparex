/**
 * 🧹 Esparex Orphan Sweep
 * 
 * This script identifies "orphan" files—files that are not imported or referenced
 * by any other file in the repository.
 * 
 * Usage: node scripts/orphan-sweep.cjs
 */

const fs = require('fs');
const path = require('path');

const SEARCH_DIRS = ['apps', 'backend', 'core', 'shared'];
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

function getAllFiles(dir, allFiles = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const name = path.join(dir, file);
        if (fs.statSync(name).isDirectory()) {
            if (file !== 'node_modules' && file !== 'dist' && file !== 'coverage' && !file.startsWith('.')) {
                getAllFiles(name, allFiles);
            }
        } else {
            if (EXTENSIONS.includes(path.extname(file)) && !file.endsWith('.d.ts')) {
                allFiles.push(name);
            }
        }
    });
    return allFiles;
}

console.log('🔍 Scanning repository for orphan files...');

const allFiles = SEARCH_DIRS.flatMap(dir => {
    const fullPath = path.join(process.cwd(), dir);
    return fs.existsSync(fullPath) ? getAllFiles(fullPath) : [];
});

console.log(`📦 Found ${allFiles.length} source files. Checking references...`);

console.log('📖 Loading all source files and metadata into memory...');
const fileContents = [];
allFiles.forEach(file => {
    try {
        fileContents.push({
            relPath: path.relative(process.cwd(), file),
            content: fs.readFileSync(file, 'utf8')
        });
    } catch {
        // Ignore read errors
    }
});

// Also load cache/metadata files to simulate original grep behavior on root
const metadataFiles = [
    'package.json',
    'package-lock.json',
    '.eslintcache',
    '.eslintcache/admin',
    '.eslintcache/web',
    '.eslintcache/backend',
    '.eslintcache/core',
    '.eslintcache/shared',
    '.jscpd-report/jscpd-report.json'
];

metadataFiles.forEach(f => {
    const fullPath = path.join(process.cwd(), f);
    try {
        if (fs.existsSync(fullPath)) {
            fileContents.push({
                relPath: f,
                content: fs.readFileSync(fullPath, 'utf8')
            });
        }
    } catch {
        /* ignore */
    }
});

// Recursively find and load any json or tsbuildinfo or manifest files in build directories if they exist
function loadExtraFiles(dir) {
    if (!fs.existsSync(dir)) return;
    try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const name = path.join(dir, file);
            if (fs.statSync(name).isDirectory()) {
                if (file !== 'node_modules' && file !== 'dist' && !file.startsWith('.')) {
                    loadExtraFiles(name);
                }
            } else {
                if (file.endsWith('.json') || file.endsWith('.tsbuildinfo') || file.includes('manifest')) {
                    fileContents.push({
                        relPath: path.relative(process.cwd(), name),
                        content: fs.readFileSync(name, 'utf8')
                    });
                }
            }
        });
    } catch {
        /* ignore */
    }
}

['apps', 'backend', 'core', 'shared'].forEach(dir => {
    loadExtraFiles(path.join(process.cwd(), dir));
});

console.log(`🔍 Checking references for ${allFiles.length} files...`);
const orphans = [];

allFiles.forEach((file, index) => {
    const fileName = path.basename(file, path.extname(file));
    const relPath = path.relative(process.cwd(), file);
    
    // Progress indicator
    if (index % 50 === 0) process.stdout.write('.');

    // Skip entrypoints, configs, tests, scripts, seeds, cron, etc.
    const normalizedPath = relPath.replace(/\\/g, '/');
    const isTest = normalizedPath.includes('__tests__') || normalizedPath.endsWith('.spec.ts') || normalizedPath.endsWith('.spec.tsx') || normalizedPath.endsWith('.test.ts') || normalizedPath.endsWith('.test.tsx');
    const isScriptOrConfig = normalizedPath.includes('scripts/') || normalizedPath.includes('seeds/') || normalizedPath.includes('cron/') || normalizedPath.includes('migrations/') || normalizedPath.endsWith('config.ts') || normalizedPath.endsWith('config.js') || normalizedPath.endsWith('config.json');
    if (isTest || isScriptOrConfig) {
        return;
    }

    let isReferenced = false;
    for (const entry of fileContents) {
        if (entry.relPath === relPath) continue;
        if (entry.content.includes(fileName)) {
            isReferenced = true;
            break;
        }
    }
    
    if (!isReferenced) {
        orphans.push(relPath);
    }
});

console.log('\n\n--------------------------------------------------');
console.log('🧹 ORPHAN REPORT');
console.log(`Detected ${orphans.length} potentially unused files:`);
console.log('--------------------------------------------------');

orphans.forEach(o => console.log(`[DELETE] ${o}`));

if (orphans.length > 0) {
    console.log('\n⚠️ ACTION REQUIRED: Verify these files are not used dynamically before deletion.');
    process.exit(1);
} else {
    console.log('\n✅ No orphans detected. Repository is lean!');
    process.exit(0);
}
