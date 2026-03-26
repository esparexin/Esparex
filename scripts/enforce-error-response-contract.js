#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const appFile = path.join(__dirname, '..', 'backend', 'src', 'app.ts');

const source = fs.readFileSync(appFile, 'utf8');
const importToken = "import { enforceErrorResponseContract } from './middleware/errorResponseContract';";
const middlewareToken = 'app.use(enforceErrorResponseContract);';
const firstApiMountToken = "app.use('/api/v1/catalog', catalogRoutes);";

if (!source.includes(importToken)) {
  console.error('Missing import for enforceErrorResponseContract in backend/src/app.ts');
  process.exit(1);
}

if (!source.includes(middlewareToken)) {
  console.error('Missing app.use(enforceErrorResponseContract) in backend/src/app.ts');
  process.exit(1);
}

const middlewareIndex = source.indexOf(middlewareToken);
const firstApiMountIndex = source.indexOf(firstApiMountToken);

if (firstApiMountIndex === -1) {
  console.error('Unable to locate first API mount in backend/src/app.ts');
  process.exit(1);
}

if (middlewareIndex > firstApiMountIndex) {
  console.error('❌ enforceErrorResponseContract must run before API routes are mounted.');
  console.error('\n💡 HINT: The error envelope middleware must be placed BEFORE any API route definitions in backend/src/app.ts');
  console.error('   to ensure consistency in error handling across all endpoints.');
  process.exit(1);
}

console.log('Error response envelope contract middleware is present and ordered correctly.');
