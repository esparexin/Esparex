#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const appFiles = [
  path.join(__dirname, '..', 'backend', 'api', 'src', 'app.ts')
];

const importToken = "import { enforceErrorResponseContract } from './middleware/errorResponseContract';";
const middlewareToken = 'app.use(enforceErrorResponseContract);';

appFiles.forEach(appFile => {
  if (!fs.existsSync(appFile)) {
    console.log(`Skipping missing file: ${appFile}`);
    return;
  }

  const source = fs.readFileSync(appFile, 'utf8');

  if (!source.includes(importToken)) {
    console.error(`Missing import for enforceErrorResponseContract in ${path.relative(process.cwd(), appFile)}`);
    process.exit(1);
  }

  if (!source.includes(middlewareToken)) {
    console.error(`Missing app.use(enforceErrorResponseContract) in ${path.relative(process.cwd(), appFile)}`);
    process.exit(1);
  }

  const middlewareIndex = source.indexOf(middlewareToken);
  
  // Find the first line that mounts a route (usually has '/api/v1' or similar)
  const lines = source.split('\n');
  const firstApiMountLineIndex = lines.findIndex(line => 
    (line.includes("app.use('") || line.includes('app.use("')) && 
    (line.includes('/api/') || line.includes('/health'))
  );
  
  if (firstApiMountLineIndex === -1) {
    console.error(`Unable to locate first API mount in ${path.relative(process.cwd(), appFile)}`);
    process.exit(1);
  }

  const firstApiMountIndex = source.indexOf(lines[firstApiMountLineIndex]);

  if (middlewareIndex > firstApiMountIndex) {
    console.error(`❌ enforceErrorResponseContract must run before API routes are mounted in ${path.relative(process.cwd(), appFile)}`);
    console.error(`\n💡 HINT: The error envelope middleware must be placed BEFORE any API route definitions in ${path.relative(process.cwd(), appFile)}`);
    console.error('   to ensure consistency in error handling across all endpoints.');
    process.exit(1);
  }
});

console.log('Error response envelope contract middleware is present and ordered correctly in all backends.');
