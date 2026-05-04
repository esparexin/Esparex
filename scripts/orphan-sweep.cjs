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
const { execSync } = require('child_process');

const SEARCH_DIRS = ['apps', 'backend', 'core', 'shared'];
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

function getAllFiles(dir, allFiles = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const name = path.join(dir, file);
        if (fs.statSync(name).isDirectory()) {
            if (file !== 'node_modules' && file !== 'dist' && !file.startsWith('.')) {
                getAllFiles(name, allFiles);
            }
        } else {
            if (EXTENSIONS.includes(path.extname(file))) {
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

const orphans = [];

allFiles.forEach((file, index) => {
    const fileName = path.basename(file, path.extname(file));
    const relPath = path.relative(process.cwd(), file);
    
    // Progress indicator
    if (index % 50 === 0) process.stdout.write('.');

    try {
        // Grep for the filename in the entire repo, excluding itself
        // We look for imports like 'from "filename"' or 'require("filename")'
        const count = execSync(`grep -r "${fileName}" . --exclude="${relPath}" --exclude-dir="node_modules" --exclude-dir="dist" | wc -l`, { encoding: 'utf8' }).trim();
        
        if (parseInt(count) === 0) {
            orphans.push(relPath);
        }
    } catch (e) {
        // Ignore errors from grep
    }
});

console.log('\n\n--------------------------------------------------');
console.log('🧹 ORPHAN REPORT');
console.log(`Detected ${orphans.length} potentially unused files:`);
console.log('--------------------------------------------------');

orphans.forEach(o => console.log(`[DELETE] ${o}`));

if (orphans.length > 0) {
    console.log('\n⚠️ ACTION REQUIRED: Verify these files are not used dynamically before deletion.');
} else {
    console.log('\n✅ No orphans detected. Repository is lean!');
}
