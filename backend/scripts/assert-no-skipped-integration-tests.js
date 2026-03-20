#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const path = require('path');

const resultPath = process.argv[2] || 'jest-integration-results.json';
const resolved = path.resolve(process.cwd(), resultPath);

if (!fs.existsSync(resolved)) {
    console.error(`[integration-guard] Jest result file not found: ${resolved}`);
    process.exit(1);
}

const raw = fs.readFileSync(resolved, 'utf8');
const parsed = JSON.parse(raw);

const pending = Number(parsed.numPendingTests || 0);
const todo = Number(parsed.numTodoTests || 0);
const total = Number(parsed.numTotalTests || 0);
const passed = Number(parsed.numPassedTests || 0);
const failed = Number(parsed.numFailedTests || 0);

if (pending > 0 || todo > 0) {
    console.error(
        `[integration-guard] Expected DB integration tests to run with no skips/todos.\n` +
        `total=${total} passed=${passed} failed=${failed} pending=${pending} todo=${todo}`
    );
    process.exit(1);
}

console.info(
    `[integration-guard] OK: total=${total} passed=${passed} failed=${failed} pending=${pending} todo=${todo}`
);
