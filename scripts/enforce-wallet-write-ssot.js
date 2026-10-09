#!/usr/bin/env node
/**
 * Wallet write SSOT guard (DECISION-GATE C-9 / P0-6).
 *
 * Fails on `UserWallet` write call sites outside the entitlements domain.
 * Canonical owner of all wallet/credit writes is
 * core/src/domains/entitlements/application/EntitlementWalletWriter.ts;
 * UserWallet is a read projection everywhere else.
 *
 * Allowlist (documented, burn-down):
 *  - core/src/domains/entitlements/** (canonical write API)
 *  - core/src/domains/payments/application/PromotionService.ts (retired
 *    promotion flow; deletion approved DECISION-GATE §4 — remove from the
 *    allowlist when the flow is deleted)
 *
 * Scans: core/src, backend/api/src (excludes __tests__ / specs / node_modules).
 * Exit 0 = no offenders. Exit 1 = lists offending files.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const WRITE_PATTERN = /UserWallet\s*\.\s*(updateOne|updateMany|findOneAndUpdate|findOneAndReplace|replaceOne|deleteOne|deleteMany|bulkWrite|insertMany)\s*\(/;
const NEW_WALLET_PATTERN = /new\s+UserWallet\s*\(/;

const ALLOWLIST = new Set([
  'core/src/domains/payments/application/PromotionService.ts', // retired flow — see header
]);

function isAllowed(relPath) {
  if (relPath.startsWith('core/src/domains/entitlements/')) return true;
  return ALLOWLIST.has(relPath);
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', 'coverage', '__tests__', '__mocks__'].includes(entry.name)) continue;
      walk(abs, out);
    } else if (entry.isFile() && /\.tsx?$/.test(entry.name) && !/\.spec\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      out.push(abs);
    }
  }
  return out;
}

function main() {
  const roots = [path.join(ROOT, 'core', 'src'), path.join(ROOT, 'backend', 'api', 'src')];
  const offenders = [];

  for (const abs of roots.flatMap((r) => walk(r))) {
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
    if (isAllowed(rel)) continue;
    let content;
    try {
      content = fs.readFileSync(abs, 'utf-8');
    } catch {
      continue;
    }
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (WRITE_PATTERN.test(line) || NEW_WALLET_PATTERN.test(line)) {
        offenders.push(`${rel}:${idx + 1}: ${line.trim().slice(0, 100)}`);
      }
    });
  }

  // The allowlist itself must stay accurate: flag entries that no longer exist
  // so the burn-down cannot rot.
  for (const allowed of ALLOWLIST) {
    if (!fs.existsSync(path.join(ROOT, allowed))) {
      console.error(`❌ C-9 wallet-write SSOT: allowlist entry no longer exists: ${allowed} — remove it from scripts/enforce-wallet-write-ssot.js.`);
      process.exit(1);
    }
  }

  if (offenders.length > 0) {
    console.error('❌ C-9 wallet-write SSOT: UserWallet writes outside the entitlements domain:');
    for (const o of offenders) console.error(`   - ${o}`);
    console.error('   Route all wallet writes through core/src/domains/entitlements/application/EntitlementWalletWriter.ts.');
    process.exit(1);
  }

  console.log('✅ C-9 wallet-write SSOT: no UserWallet writes outside the entitlements domain.');
  process.exit(0);
}

if (require.main === module) main();

module.exports = { WRITE_PATTERN, NEW_WALLET_PATTERN, ALLOWLIST };
