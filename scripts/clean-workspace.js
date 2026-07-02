#!/usr/bin/env node

/**
 * Esparex Workspace Cleanup Script (Cross-Platform)
 * Removes all build artifacts, logs, and temporary files safely on Windows, macOS, and Linux.
 */

const fs = require('fs');
const path = require('path');

console.log("🧹 Starting workspace cleanup...");

function walk(dir, callback) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules') continue;
            callback(fullPath, true);
            walk(fullPath, callback);
        } else if (entry.isFile()) {
            callback(fullPath, false);
        }
    }
}

// 1. Remove dist folders and temporary files dynamically
const distDirs = [];
const logFiles = [];
const dsStoreFiles = [];

walk(process.cwd(), (itemPath, isDir) => {
    if (isDir) {
        if (path.basename(itemPath) === 'dist') {
            distDirs.push(itemPath);
        }
    } else {
        const ext = path.extname(itemPath);
        const name = path.basename(itemPath);
        if (ext === '.log') {
            logFiles.push(itemPath);
        } else if (name === '.DS_Store') {
            dsStoreFiles.push(itemPath);
        }
    }
});

// Remove build artifacts
if (distDirs.length > 0) {
    console.log("📦 Removing dist folders...");
    distDirs.forEach(dir => {
        try {
            fs.rmSync(dir, { recursive: true, force: true });
            console.log(`  - Removed: ${path.relative(process.cwd(), dir)}`);
        } catch (e) {
            console.error(`  - Failed to remove ${dir}:`, e.message);
        }
    });
}

// Remove log files
if (logFiles.length > 0 || dsStoreFiles.length > 0) {
    console.log("📝 Removing log and temp files...");
    [...logFiles, ...dsStoreFiles].forEach(file => {
        try {
            fs.unlinkSync(file);
            console.log(`  - Removed: ${path.relative(process.cwd(), file)}`);
        } catch (e) {
            console.error(`  - Failed to remove ${file}:`, e.message);
        }
    });
}

// Remove static log folders if they exist
const staticLogDirs = [
    path.join(process.cwd(), 'logs'),
    path.join(process.cwd(), 'backend/user/logs'),
    path.join(process.cwd(), 'backend/logs')
];

staticLogDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        try {
            fs.rmSync(dir, { recursive: true, force: true });
            console.log(`  - Removed static dir: ${path.relative(process.cwd(), dir)}`);
        } catch (e) {
            console.error(`  - Failed to remove static dir ${dir}:`, e.message);
        }
    }
});

console.log("✅ Cleanup complete! You are ready for a fresh build.");
