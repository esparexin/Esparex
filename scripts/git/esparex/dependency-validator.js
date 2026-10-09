#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { runStandalone, ROOT } = require('../shared');

const META = { id: 'DEP-001', name: 'Dependency Boundary Validation', version: '2.0.0', category: 'Architecture' };

const BASELINE_PATH = path.join(ROOT, 'scripts/policy/domain-boundary-baseline.json');

// DECISION-GATE C-7/C-11: burn-down rules whose pre-existing violations are
// grandfathered at a ceiling count. The gate fails if the count grows; the
// baseline auto-tightens when the count shrinks (burn-down toward zero).
const BURN_DOWN_RULES = [
  'domain-cannot-import-infrastructure-or-adapters',
  'controllers-via-composition-facades',
];

function loadBaselines() {
  try {
    return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8')).baselines || {};
  } catch {
    return {};
  }
}

function saveBaselines(baselines) {
  const doc = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8'));
  doc.baselines = baselines;
  doc.updatedAt = new Date().toISOString();
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(doc, null, 2) + '\n');
}

function countMongooseValueImports() {
  // Files under core/src/domains (excluding adapters/) with a non-`import type`
  // mongoose import. Type-only imports are erased at compile time and excluded.
  let out = '';
  try {
    out = execSync(`git grep -l "from ['\\"]mongoose['\\"]" -- 'core/src/domains'`, {
      cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch { return 0; }
  let count = 0;
  for (const file of out.split('\n').filter(Boolean)) {
    if (file.includes('/adapters/')) continue;
    let content = '';
    try {
      content = fs.readFileSync(path.join(ROOT, file), 'utf-8');
    } catch { continue; }
    const hasValueImport = content.split('\n').some((line) => {
      const t = line.trim();
      if (!t.includes('mongoose')) return false;
      if (/^import\s+type\b/.test(t)) return false;
      return /(^import\s+[^t]|^import\s*\{|^import\s+\*\s+as|^import\s+[A-Za-z_$])/.test(t) && /from\s+['"]mongoose['"]/.test(t);
    });
    if (hasValueImport) count++;
  }
  return count;
}

function run(val) {
  let out = '';
  try {
    const depcruiseBin = path.join(ROOT, 'node_modules/.bin/depcruise');
    const depcruiseJs = path.join(ROOT, 'node_modules/dependency-cruiser/bin/dependency-cruiser.mjs');
    // RC-1 fix: --no-bin-links environments lack .bin/ symlinks.
    const cmd = fs.existsSync(depcruiseBin) ? `"${depcruiseBin}"` : fs.existsSync(depcruiseJs) ? `node "${depcruiseJs}"` : 'npx depcruise';
    out = execSync(`${cmd} --config .dependency-cruiser.js core backend/api apps/web/src apps/admin/src`, {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    if (out.includes('error ')) {
      val.error(`Dependency boundary violations detected:\n${out.trim()}`);
    } else {
      val.info('Dependency boundary checks passed with 0 errors');
    }
  } catch (e) {
    const output = (e.stdout || '') + (e.stderr || '');
    // Burn-down rules report through the baseline below; any OTHER error line
    // is a hard failure. Depcruise exits non-zero when errors exist, so parse
    // per-rule and re-classify.
    out = output;
    const lines = output.split('\n');
    const hardErrors = lines.filter((l) => {
      if (!l.includes('error ')) return false;
      return !BURN_DOWN_RULES.some((rule) => l.includes(`error ${rule}:`) || l.includes(`error ${rule} `));
    });
    if (hardErrors.length > 0) {
      val.error(`Dependency boundary violations detected:\n${hardErrors.join('\n').trim()}`);
    } else if (!output.includes('error ')) {
      val.error(`Dependency cruiser check failed: ${e.message}`);
    }
    // else: only burn-down-rule errors present — handled by the baseline check below
  }

  // Burn-down enforcement (C-7, C-11)
  const baselines = loadBaselines();
  let tightened = false;
  for (const rule of BURN_DOWN_RULES) {
    const count = out.split('\n').filter((l) => l.includes(`error ${rule}:`) || l.includes(`error ${rule} `)).length;
    const base = baselines[rule];
    if (!base) {
      val.error(`Burn-down baseline missing for rule "${rule}" in scripts/policy/domain-boundary-baseline.json`);
      continue;
    }
    if (count > base.count) {
      val.error(`Boundary burn-down regression [${rule}]: ${count} violations exceed baseline ceiling ${base.count} — fix new violations, do not raise the baseline.`);
    } else if (count < base.count) {
      base.count = count;
      tightened = true;
      val.info(`Boundary burn-down [${rule}]: ${count} violations (baseline tightened from previous ceiling)`);
    } else {
      val.info(`Boundary burn-down [${rule}]: ${count} violations at baseline ceiling (burn down toward 0)`);
    }
  }

  const mongooseCount = countMongooseValueImports();
  const mongooseBase = baselines.mongooseValueImportsInDomains;
  if (!mongooseBase) {
    val.error('Burn-down baseline missing for "mongooseValueImportsInDomains" in scripts/policy/domain-boundary-baseline.json');
  } else if (mongooseCount > mongooseBase.count) {
    val.error(`Boundary burn-down regression [mongoose-in-domains]: ${mongooseCount} files exceed baseline ceiling ${mongooseBase.count} — route new mongoose usage through ports/adapters.`);
  } else if (mongooseCount < mongooseBase.count) {
    mongooseBase.count = mongooseCount;
    tightened = true;
    val.info(`Boundary burn-down [mongoose-in-domains]: ${mongooseCount} files (baseline tightened from previous ceiling)`);
  } else {
    val.info(`Boundary burn-down [mongoose-in-domains]: ${mongooseCount} files at baseline ceiling (burn down toward 0)`);
  }

  if (tightened) {
    try {
      saveBaselines(baselines);
      val.info('Burn-down baselines tightened and saved to scripts/policy/domain-boundary-baseline.json');
    } catch (e) {
      val.error(`Failed to persist tightened burn-down baselines: ${e.message}`);
    }
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
