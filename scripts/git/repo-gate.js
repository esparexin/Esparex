#!/usr/bin/env node
const { Validation, formatReport, ROOT } = require('./shared');

const checks = [
  require('./workspace-check'),
  require('./secret-scan'),
  require('./binary-check'),
  require('./lockfile-check'),
  require('./esparex/branch-protection'),
  require('./esparex/route-validator'),
  require('./esparex/contract-validator'),
  require('./esparex/env-validator'),
  require('./esparex/ssot-validator'),
  require('./esparex/architecture-validator'),
  require('./esparex/duplicate-validator'),
  require('./esparex/circular-validator'),
  require('./esparex/dependency-validator'),
];

const results = [];

for (const mod of checks) {
  const val = new Validation(mod.meta);
  const start = Date.now();
  try {
    mod.run(val);
  } catch (e) {
    val.error(`Validator error: ${e.message}`);
  }
  val.elapsedMs = Date.now() - start;
  results.push(val);
}

const report = formatReport(results);
console.log(report);

const hasBlockers = results.some(r => r.errors.length > 0);
process.exit(hasBlockers ? 1 : 0);
