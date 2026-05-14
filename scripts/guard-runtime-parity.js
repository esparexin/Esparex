#!/usr/bin/env node

const runtimeVersion =
  process.versions.node || process.version.replace(/^v/, '');

const [major] = runtimeVersion.split('.');

const requiredMajor = '22';
const policy = '>=22.0.0 <23';

if (major !== requiredMajor) {
  console.error('[guard:runtime-parity] Unsupported Node.js runtime detected.');
  console.error(`[guard:runtime-parity] Current: v${runtimeVersion}`);
  console.error(`[guard:runtime-parity] Required policy: ${policy}`);
  process.exit(1);
}

console.log(
  `[guard:runtime-parity] Runtime parity check passed on Node v${runtimeVersion} (policy: ${policy}).`
);