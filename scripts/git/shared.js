#!/usr/bin/env node
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');

const SEVERITY = { ERROR: 'error', WARNING: 'warning', INFO: 'info' };

class Validation {
  constructor(meta) {
    this.meta = meta || { id: 'UNKN-000', name: 'Unknown', version: '0.0.0', category: 'Uncategorized' };
    this.errors = [];
    this.warnings = [];
    this.infos = [];
    this.elapsedMs = 0;
  }

  get name() {
    return this.meta.name;
  }

  error(msg) {
    this.errors.push(msg);
  }

  warning(msg) {
    this.warnings.push(msg);
  }

  info(msg) {
    this.infos.push(msg);
  }

  get passed() {
    return this.errors.length === 0;
  }

  get statusLabel() {
    const hasErrors = this.errors.length > 0;
    const hasWarnings = this.warnings.length > 0;
    if (hasErrors) return '✗ FAIL';
    if (hasWarnings) return '~ WARN';
    return '✓ PASS';
  }

  get statusCode() {
    if (this.errors.length > 0) return 'ERR';
    if (this.warnings.length > 0) return 'WARN';
    return 'PASS';
  }

  get elapsed() {
    if (this.elapsedMs < 1000) return `${this.elapsedMs}ms`;
    return `${(this.elapsedMs / 1000).toFixed(2)}s`;
  }

  print() {
    for (const e of this.errors) console.error(`  [ERROR] ${e}`);
    for (const w of this.warnings) console.error(`  [WARN]  ${w}`);
    for (const i of this.infos) console.error(`  [INFO]  ${i}`);
  }
}

function formatReport(results) {
  const sep = '═'.repeat(60);
  const lines = [];
  lines.push('');
  lines.push(`╔${sep}╗`);
  lines.push(`║  Esparex Repository Integrity Report`.padEnd(62) + '║');
  lines.push(`╚${sep}╝`);
  lines.push('');

  let longestId = 0;
  let longestName = 0;
  for (const r of results) {
    if (r.meta.id.length > longestId) longestId = r.meta.id.length;
    if (r.name.length > longestName) longestName = r.name.length;
  }

  for (const r of results) {
    const status = r.statusCode.padEnd(5);
    const id = r.meta.id.padEnd(longestId + 1);
    const name = r.name.padEnd(longestName + 2);
    const counts = [];
    if (r.errors.length > 0) counts.push(`E${r.errors.length}`);
    if (r.warnings.length > 0) counts.push(`W${r.warnings.length}`);
    if (r.infos.length > 0) counts.push(`I${r.infos.length}`);
    const extra = counts.length > 0 ? ` (${counts.join(', ')})` : '';
    const time = r.elapsed.padStart(7);
    lines.push(`  ${status}  ${id} ${name}${extra}${time}`);
  }

  lines.push('');

  const totalErrors = results.reduce((s, r) => s + r.errors.length, 0);
  const totalWarnings = results.reduce((s, r) => s + r.warnings.length, 0);
  const totalInfos = results.reduce((s, r) => s + r.infos.length, 0);

  if (totalErrors > 0) {
    lines.push(`  ── Errors (${totalErrors}) ──`);
    for (const r of results) {
      if (r.errors.length > 0) {
        for (const e of r.errors) lines.push(`    ERROR  ${r.meta.id}  ${e}`);
      }
    }
    lines.push('');
  }

  if (totalWarnings > 0) {
    lines.push(`  ── Warnings (${totalWarnings}) ──`);
    for (const r of results) {
      if (r.warnings.length > 0) {
        for (const w of r.warnings) lines.push(`    WARN   ${r.meta.id}  ${w}`);
      }
    }
    lines.push('');
  }

  if (totalInfos > 0) {
    lines.push(`  ── Info (${totalInfos}) ──`);
    for (const r of results) {
      if (r.infos.length > 0) {
        for (const i of r.infos) lines.push(`    INFO   ${r.meta.id}  ${i}`);
      }
    }
    lines.push('');
  }

  const hasErrors = results.some(r => r.errors.length > 0);
  const hasWarnings = results.some(r => r.warnings.length > 0);

  if (hasErrors) {
    lines.push(`  ✗ Gate failed — ${totalErrors} error${totalErrors > 1 ? 's' : ''} found.`);
  } else if (hasWarnings) {
    lines.push(`  ~ Gate passed — ${totalWarnings} warning${totalWarnings > 1 ? 's' : ''}. Review recommended.`);
  } else {
    lines.push(`  ✓ All repository gate checks passed.`);
  }
  lines.push('');

  // GOV-008 Repository Health Summary Card
  const healthScore = totalErrors === 0 ? 100 : Math.max(0, 100 - (totalErrors * 15 + totalWarnings * 2));
  const summarySep = '─'.repeat(60);
  lines.push(`╔${sep}╗`);
  lines.push(`║                  Repository Health Summary                ║`);
  lines.push(`╠${sep}╣`);
  for (const r of results) {
    const statusIcon = r.errors.length > 0 ? '✗ FAIL' : (r.warnings.length > 0 ? '~ WARN' : '✓ PASS');
    const namePadded = r.name.padEnd(38);
    lines.push(`║  ${namePadded}  ${statusIcon.padEnd(14)} ║`);
  }
  lines.push(`╠${sep}╣`);
  lines.push(`║  Repository Status: ${(totalErrors === 0 ? 'PASS' : 'FAIL').padEnd(36)} ║`);
  lines.push(`║  Health Score: ${`${healthScore}%`.padEnd(40)} ║`);
  lines.push(`╚${sep}╝`);
  lines.push('');

  return lines.join('\n');
}

function runStandalone(meta, fn) {
  const val = new Validation(meta);
  const start = Date.now();
  fn(val);
  val.elapsedMs = Date.now() - start;
  val.print();
  console.log(`\n${val.statusLabel} ${meta.id} ${meta.name} (${val.elapsed})`);
  process.exit(val.passed ? 0 : 1);
}

module.exports = { Validation, formatReport, runStandalone, ROOT, SEVERITY };
