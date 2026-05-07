#!/usr/bin/env node

const runtimeVersion = process.versions.node || process.version.replace(/^v/, '');
const [major] = runtimeVersion.split('.');
const allowedMajors = new Set(['20', '22']);
const recommendedMajor = '22';

if (!allowedMajors.has(major)) {
  console.error('[guard:runtime-parity] Unsupported Node.js runtime detected.');
  console.error(`[guard:runtime-parity] Current: v${runtimeVersion}`);
  console.error('[guard:runtime-parity] Allowed policy: ^20 || ^22');
  console.error(`[guard:runtime-parity] Recommended standard: ${recommendedMajor}.x`);
  process.exit(1);
}

console.log(
  `[guard:runtime-parity] Runtime parity check passed on Node v${runtimeVersion} (policy: ^20 || ^22).`
);
