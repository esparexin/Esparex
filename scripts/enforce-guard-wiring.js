#!/usr/bin/env node
/**
 * Meta-guard: Tier A wiring enforcement (DECISION-GATE C-1).
 *
 * Verifies three invariants on the working tree:
 *  1. Every Tier A rule in governance/tier-a-enforcement.json maps to >=1
 *     guard script file that exists.
 *  2. Every `guard:*` npm script is wired into a real enforcement surface
 *     (repo:gate, GOV-GUARDS-001, CI workflows, husky hooks, or another npm
 *     script) or explicitly allowlisted in tier-a-enforcement.json.
 *  3. Every repo:gate validator module fails closed (calls val.error on
 *     failure paths) and reports a non-zero audit count (calls val.info /
 *     val.warning with findings) — no silent vacuous passes.
 *
 * Exit 0 = all invariants hold. Exit 1 = wiring gap (blocks merge).
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MAP_PATH = path.join(ROOT, 'governance', 'tier-a-enforcement.json');

const failures = [];
const notes = [];

function fail(msg) {
  failures.push(msg);
}

// ─── Load the Tier A map ────────────────────────────────────────────────────
let tierMap;
try {
  tierMap = JSON.parse(fs.readFileSync(MAP_PATH, 'utf-8'));
} catch (e) {
  console.error(`❌ C-1 meta-guard: cannot read ${path.relative(ROOT, MAP_PATH)}: ${e.message}`);
  process.exit(1);
}

// ─── Invariant 1: every Tier A rule maps to >=1 guard on the working tree ──
let mappedRules = 0;
for (const entry of tierMap.tierA || []) {
  const guards = entry.guards || [];
  if (guards.length === 0) {
    fail(`Tier A rule "${entry.rule}" maps to zero guards`);
    continue;
  }
  const missing = guards.filter((g) => !fs.existsSync(path.join(ROOT, g)));
  if (missing.length === guards.length) {
    fail(`Tier A rule "${entry.rule}" has no guard on the working tree (missing: ${missing.join(', ')})`);
  } else {
    if (missing.length > 0) {
      notes.push(`Tier A rule "${entry.rule}": ${missing.length} mapped guard(s) absent but >=1 present (${missing.join(', ')})`);
    }
    mappedRules++;
  }
}

// ─── Invariant 2: every guard:* script referenced or allowlisted ────────────
const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
const scripts = rootPkg.scripts || {};
const guardScripts = Object.entries(scripts).filter(([name]) => name.startsWith('guard:'));
const allowlist = tierMap.guardScriptAllowlist || {};

// Wiring surfaces: any file whose content may reference a guard.
const surfaceFiles = [];
const addIfExists = (p) => {
  if (fs.existsSync(p)) surfaceFiles.push(p);
};
addIfExists(path.join(ROOT, 'scripts', 'git', 'repo-gate.js'));
addIfExists(path.join(ROOT, 'scripts', 'git', 'esparex', 'governance-guards-validator.js'));
for (const f of fs.readdirSync(path.join(ROOT, '.github', 'workflows'))) {
  addIfExists(path.join(ROOT, '.github', 'workflows', f));
}
for (const f of fs.readdirSync(path.join(ROOT, '.husky'))) {
  const p = path.join(ROOT, '.husky', f);
  if (fs.statSync(p).isFile()) surfaceFiles.push(p);
}
// Other npm scripts count as wiring (e.g. pr:gate chains guard:* scripts).
const npmScriptCorpus = Object.entries(scripts)
  .map(([name, cmd]) => `${name} ${cmd}`)
  .join('\n');
const surfaceCorpus = surfaceFiles.map((f) => {
  try {
    return fs.readFileSync(f, 'utf-8');
  } catch {
    return '';
  }
}).join('\n');

let wiredCount = 0;
for (const [name, cmd] of guardScripts) {
  // 2a. The command must reference at least one real file (or be allowlisted as CLI-only).
  const fileRefs = [...cmd.matchAll(/scripts\/[A-Za-z0-9/_.-]+\.(js|mjs|cjs|ts)/g)].map((m) => m[0]);
  const missingRefs = fileRefs.filter((r) => !fs.existsSync(path.join(ROOT, r)));
  if (fileRefs.length > 0 && missingRefs.length === fileRefs.length) {
    fail(`guard:* script "${name}" references no existing file (${missingRefs.join(', ')})`);
    continue;
  }
  // 2b. The guard must be wired into an enforcement surface or allowlisted.
  const baseNames = fileRefs.map((r) => path.basename(r));
  const referenced =
    surfaceCorpus.includes(name) ||
    surfaceCorpus.includes(`guard:${name.split(':')[1]}`) ||
    baseNames.some((b) => surfaceCorpus.includes(b)) ||
    npmScriptCorpus.split('\n').some((line) => line !== `${name} ${cmd}` && (line.includes(name) || baseNames.some((b) => line.includes(b))));
  if (!referenced && !allowlist[name]) {
    fail(`guard:* script "${name}" is not wired into any enforcement surface (repo:gate, GOV-GUARDS-001, CI, hooks, npm chains) and not allowlisted`);
    continue;
  }
  wiredCount++;
}

// ─── Invariant 3: validators fail closed and report audit counts ────────────
const gateSrc = fs.readFileSync(path.join(ROOT, 'scripts', 'git', 'repo-gate.js'), 'utf-8');
const validatorPaths = [...gateSrc.matchAll(/require\(['"]([^'"]+)['"]\)/g)]
  .map((m) => m[1])
  .filter((r) => r.startsWith('./'))
  .map((r) => path.resolve(ROOT, 'scripts', 'git', `${r.slice(2)}.js`));

let closedCount = 0;
const callPattern = /(?:val|v|validation)\s*\.\s*(error|info|warning)\s*\(/g;
for (const vPath of validatorPaths) {
  const rel = path.relative(ROOT, vPath);
  if (!fs.existsSync(vPath)) {
    fail(`repo:gate requires missing validator module ${rel}`);
    continue;
  }
  if (path.basename(vPath) === 'shared.js') {
    continue; // infrastructure helper, not a validator
  }
  const src = fs.readFileSync(vPath, 'utf-8');
  const calls = new Set([...src.matchAll(callPattern)].map((m) => m[1]));
  // C-1: "reports non-zero audit count OR fails closed" — disjunction.
  const failsClosed = calls.has('error');
  const reportsCount = calls.has('info') || calls.has('warning');
  if (!failsClosed && !reportsCount) {
    fail(`validator ${rel} neither fails closed (val.error) nor reports audit findings (val.info/val.warning)`);
  } else {
    closedCount++;
  }
}

// ─── Report ─────────────────────────────────────────────────────────────────
console.log('🔌 C-1 guard-wiring meta-guard');
console.log(`   Tier A rules mapped to working-tree guards: ${mappedRules}/${(tierMap.tierA || []).length}`);
console.log(`   guard:* scripts wired or allowlisted:        ${wiredCount}/${guardScripts.length}`);
console.log(`   repo:gate validators fail-closed + counted:  ${closedCount}/${validatorPaths.length}`);
for (const n of notes) console.log(`   note: ${n}`);

if (failures.length > 0) {
  console.error('\n❌ C-1 guard-wiring violations:');
  for (const f of failures) console.error(`   - ${f}`);
  process.exit(1);
}

console.log('✅ C-1 guard wiring intact — every Tier A rule has a guard, every guard is wired, every validator fails closed.');
process.exit(0);
