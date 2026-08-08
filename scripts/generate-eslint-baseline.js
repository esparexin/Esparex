/**
 * 🛠️ ESLint Baseline Generator
 * 
 * Usage: node scripts/generate-eslint-baseline.js
 * 
 * This script runs a full monorepo lint and saves the results to eslint-baseline.json.
 * Use this to lock in existing technical debt so CI can block ONLY new violations.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASELINE_FILE = path.join(__dirname, '../eslint-baseline.json');

console.log('🚀 Starting full monorepo lint to generate baseline...');

function normalizeFilePath(filePath) {
    if (!filePath) return '';
    let relPath = path.isAbsolute(filePath) ? path.relative(process.cwd(), filePath) : filePath;
    relPath = relPath.replace(/^.*?[/\\](apps|backend|core|shared|packages|scripts|tooling|\.agents|\.github)/, '$1');
    return relPath.replace(/\\/g, '/');
}

function processAndSaveBaseline(rawJsonOutput) {
    try {
        const parsed = JSON.parse(rawJsonOutput);
        const normalized = parsed.map(file => ({
            ...file,
            filePath: normalizeFilePath(file.filePath)
        }));
        fs.writeFileSync(BASELINE_FILE, JSON.stringify(normalized, null, 2));
        console.log(`🎉 Baseline saved to: ${BASELINE_FILE}`);
    } catch (e) {
        fs.writeFileSync(BASELINE_FILE, rawJsonOutput);
        console.log(`🎉 Raw baseline saved to: ${BASELINE_FILE}`);
    }
}

try {
    // Run full lint with JSON formatter
    const output = execSync('npx eslint . --format json', { 
        maxBuffer: 1024 * 1024 * 100, // 100MB buffer for large projects
        env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=8192' }
    });
    
    console.log('✅ Lint complete (no issues found, or all warnings).');
    processAndSaveBaseline(output.toString());
} catch (error) {
    // execSync throws if exit code is not 0
    if (error.stdout) {
        console.log('⚠️ Lint found violations. Saving these as the baseline...');
        processAndSaveBaseline(error.stdout.toString());
    } else {
        console.error('❌ Failed to generate baseline:', error.message);
        process.exit(1);
    }
}
