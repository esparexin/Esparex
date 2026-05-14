/**
 * 🛡️ Esparex Governance: Lint Baseline Enforcement
 * 
 * This script ensures that while we have technical debt (legacy lint issues),
 * we NEVER allow new violations to enter the codebase.
 * 
 * Logic:
 * 1. Load the baseline JSON (generated via scripts/generate-eslint-baseline.js)
 * 2. Load the current CI lint results (passed as an argument)
 * 3. Filter out "known" issues by matching filePath and ruleId.
 * 4. Fail if any NEW issues are found or if CRITICAL governance rules are violated.
 */

const fs = require('fs');
const path = require('path');

const BASELINE_PATH = path.join(__dirname, '../eslint-baseline.json');
const CI_RESULTS_PATH = process.argv[2];

if (!CI_RESULTS_PATH || !fs.existsSync(CI_RESULTS_PATH)) {
    console.error('❌ Error: CI results path missing or invalid.');
    process.exit(1);
}

if (!fs.existsSync(BASELINE_PATH)) {
    console.warn('⚠️ Warning: No baseline file found at eslint-baseline.json. All issues will be treated as NEW.');
}

const baselineRaw = fs.existsSync(BASELINE_PATH) ? fs.readFileSync(BASELINE_PATH, 'utf8') : '[]';
const ciRaw = fs.readFileSync(CI_RESULTS_PATH, 'utf8');

const baseline = JSON.parse(baselineRaw);
const ciResults = JSON.parse(ciRaw);

// Critical rules that can NEVER be in the baseline or new code
const CRITICAL_RULES = [
    'esparex/no-status-mutation-outside-status-mutation-service',
    'react-hooks/rules-of-hooks'
];

let newIssues = [];
let legacyIssuesCount = 0;

// Create a lookup map for the baseline
// Key: filePath + ruleId + line (approximate)
const baselineMap = new Set();
baseline.forEach(file => {
    const relPath = path.relative(process.cwd(), file.filePath);
    file.messages.forEach(msg => {
        baselineMap.add(`${relPath}:${msg.ruleId}`);
    });
});

ciResults.forEach(file => {
    const relPath = path.relative(process.cwd(), file.filePath);
    file.messages.forEach(msg => {
        const key = `${relPath}:${msg.ruleId}`;
        
        const isCritical = CRITICAL_RULES.includes(msg.ruleId);
        const isNew = !baselineMap.has(key);

        if (isCritical || isNew) {
            newIssues.push({
                file: relPath,
                line: msg.line,
                rule: msg.ruleId,
                message: msg.message,
                severity: isCritical ? 'CRITICAL' : 'NEW'
            });
        } else {
            legacyIssuesCount++;
        }
    });
});

console.log('--------------------------------------------------');
console.log(`📊 Lint Audit Summary:`);
console.log(`✅ Legacy Violations (Allowed): ${legacyIssuesCount}`);
console.log(`❌ New/Critical Violations: ${newIssues.length}`);
console.log('--------------------------------------------------');

if (newIssues.length > 0) {
    console.error('🚫 GOVERNANCE FAILURE: New or Critical lint violations detected!');
    newIssues.forEach(issue => {
        console.error(`[${issue.severity}] ${issue.file}:${issue.line} -> ${issue.rule}: ${issue.message}`);
    });
    process.exit(1);
}

console.log('🎉 Governance Check Passed! No new violations introduced.');
process.exit(0);
