#!/usr/bin/env node

/**
 * Enforce ObjectId validation in controllers
 * 
 * Detects usage of req.params.id (or similar) without preceding validation.
 */

const fs = require('fs');
const path = require('path');

const CONTROLLER_ROOT = path.join(process.cwd(), 'backend/user/src/controllers');
const VALIDATION_PATTERN = /isValidObjectId|Types\.ObjectId|new\s+ObjectId/i;
const ID_PARAM_PATTERN = /req\.params\.(id|.*Id)\b/g;

const BASELINE = [
  'backend/user/src/controllers/chat/chatController.ts',
  'backend/user/src/controllers/notification/notificationMutationController.ts',
  'backend/user/src/controllers/payment/paymentQueryController.ts',
  'backend/user/src/controllers/smartAlert/savedSearchController.ts',
  'backend/user/src/controllers/smartAlert/shared.ts'
];

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, fileList);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const violations = [];
const files = walk(CONTROLLER_ROOT);

files.forEach(file => {
  const relativePath = path.relative(process.cwd(), file);
  if (BASELINE.includes(relativePath)) return;

  const content = fs.readFileSync(file, 'utf8');

  // Simplified check: if req.params.id is used, isValidObjectId should also be present in the file
  // A better check would be per-function, but this is a good baseline for SSOT compliance.
  const hasIdParam = ID_PARAM_PATTERN.test(content);
  const hasValidation = VALIDATION_PATTERN.test(content);

  if (hasIdParam && !hasValidation) {
    violations.push({ file: relativePath, reason: 'Detected req.params.id usage without obvious ObjectId validation (isValidObjectId).' });
  }
});

if (violations.length > 0) {
  console.error('❌ ObjectId Validation Check Failed:');
  violations.forEach(v => {
    console.error(`  - ${v.file} :: ${v.reason}`);
  });
  console.error('\n💡 HINT: Always validate incoming ObjectIds using isValidObjectId() before database operations.');
  process.exit(1);
}

console.log('✅ ObjectId Validation Check Passed.');
