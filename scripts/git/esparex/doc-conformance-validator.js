#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { runStandalone, ROOT } = require('../shared');

const META = { id: 'DOC-CONF-001', name: 'Doc Conformance (C-14)', version: '1.0.0', category: 'Governance' };

function checkDepcruiserRegexes(val) {
  let config;
  try {
    config = require(path.join(ROOT, '.dependency-cruiser.js'));
  } catch (e) {
    val.error(`C-14: cannot load .dependency-cruiser.js: ${e.message}`);
    return;
  }
  let files = [];
  try {
    files = execSync('git ls-files', { cwd: ROOT, encoding: 'utf-8' }).split('\n').filter(Boolean);
  } catch {
    val.error('C-14: cannot list tracked files (git ls-files failed)');
    return;
  }
  let checked = 0;
  for (const rule of config.forbidden || []) {
    for (const side of ['from', 'to']) {
      const spec = rule[side];
      if (!spec || !spec.path) continue; // pathNot-only sides are negations, not matchers
      checked++;
      let re;
      try {
        re = new RegExp(spec.path);
      } catch {
        val.error(`C-14: rule "${rule.name}" has an invalid ${side} regex: ${spec.path}`);
        continue;
      }
      if (!files.some((f) => re.test(f))) {
        val.error(`C-14: dead depcruiser branch — rule "${rule.name}" ${side} regex matches zero tracked files: ${spec.path}`);
      }
    }
  }
  if (checked > 0) val.info(`C-14: ${checked} depcruiser from/to regexes each match >=1 tracked file`);
}

function checkContextCount(val) {
  // ARCHITECTURE.md's bounded-context list must equal the domains on disk.
  const archPath = path.join(ROOT, 'ARCHITECTURE.md');
  const domainsDir = path.join(ROOT, 'core', 'src', 'domains');
  let content;
  try {
    content = fs.readFileSync(archPath, 'utf-8');
  } catch {
    val.error('C-14: cannot read ARCHITECTURE.md');
    return;
  }
  const fences = [...content.matchAll(/```text([\s\S]*?)```/g)].map((m) => m[1]);
  const fence = fences.find((b) => b.includes('Migrated Bounded Contexts')) || '';
  // The context list runs from the heading to the 🎉 completion marker; the
  // same fence continues with Modernization Patterns below it.
  const listSection = fence.split('🎉')[0];
  const docCount = listSection.split('\n').filter((l) => l.trim().startsWith('✅')).length;
  let diskCount = 0;
  try {
    diskCount = fs.readdirSync(domainsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).length;
  } catch {
    val.error('C-14: cannot list core/src/domains');
    return;
  }
  if (docCount !== diskCount) {
    val.error(`C-14: ARCHITECTURE.md lists ${docCount} bounded contexts but core/src/domains has ${diskCount} — update the doc, not the code`);
  } else {
    val.info(`C-14: ARCHITECTURE.md bounded-context count (${docCount}) == core/src/domains (${diskCount})`);
  }
}

function run(val) {
  checkDepcruiserRegexes(val);
  checkContextCount(val);
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
