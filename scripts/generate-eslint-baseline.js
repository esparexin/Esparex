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

try {
    // Run full lint with JSON formatter
    const output = execSync('npx eslint . --format json', { 
        maxBuffer: 1024 * 1024 * 100, // 100MB buffer for large projects
        env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=8192' }
    });
    
    console.log('✅ Lint complete (no issues found, or all warnings).');
    fs.writeFileSync(BASELINE_FILE, output);
    console.log(`🎉 Baseline saved to: ${BASELINE_FILE}`);
} catch (error) {
    // execSync throws if exit code is not 0
    if (error.stdout) {
        console.log('⚠️ Lint found violations. Saving these as the baseline...');
        fs.writeFileSync(BASELINE_FILE, error.stdout);
        console.log(`🎉 Baseline (with violations) saved to: ${BASELINE_FILE}`);
    } else {
        console.error('❌ Failed to generate baseline:', error.message);
        process.exit(1);
    }
}
