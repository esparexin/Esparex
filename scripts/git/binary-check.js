#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Validation, runStandalone, ROOT } = require('./shared');

const META = { id: 'BIN-001', name: 'Binary Detection', version: '1.0.0', category: 'Integrity' };

const SOURCE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx',
  '.json', '.yml', '.yaml',
  '.css', '.scss', '.md',
];

const SUSPICIOUS_FILES = [
  'types_temp.ts', 'backup.ts', 'foo_old.ts',
];

function isBinary(buf) {
  const sampleLen = Math.min(buf.length, 8192);
  for (let i = 0; i < sampleLen; i++) {
    if (buf[i] === 0) return true;
  }
  return false;
}

function isValidUTF8(buf) {
  let i = 0;
  while (i < buf.length) {
    if ((buf[i] & 0x80) === 0) { i += 1; }
    else if ((buf[i] & 0xE0) === 0xC0) {
      if (i + 1 >= buf.length || (buf[i + 1] & 0xC0) !== 0x80) return false;
      i += 2;
    } else if ((buf[i] & 0xF0) === 0xE0) {
      if (i + 2 >= buf.length || (buf[i + 1] & 0xC0) !== 0x80 || (buf[i + 2] & 0xC0) !== 0x80) return false;
      i += 3;
    } else if ((buf[i] & 0xF8) === 0xF0) {
      if (i + 3 >= buf.length || (buf[i + 1] & 0xC0) !== 0x80 || (buf[i + 2] & 0xC0) !== 0x80 || (buf[i + 3] & 0xC0) !== 0x80) return false;
      i += 4;
    } else { return false; }
  }
  return true;
}

function run(val) {
  const stagedFiles = (() => {
    try {
      const out = execSync('git diff --cached --name-only --diff-filter=ACMR', { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      return out.split('\n').filter(Boolean);
    } catch { return []; }
  })();

  if (stagedFiles.length === 0) return;

  for (const file of stagedFiles) {
    const ext = path.extname(file).toLowerCase();
    const basename = path.basename(file);
    const isSourceFile = SOURCE_EXTENSIONS.includes(ext);
    const isSuspicious = SUSPICIOUS_FILES.includes(basename);
    if (!isSourceFile && !isSuspicious) continue;

    const fullPath = path.join(ROOT, file);
    if (!fs.existsSync(fullPath)) continue;
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) continue;

    const buf = fs.readFileSync(fullPath);

    if (isBinary(buf)) {
      val.error(`Binary data detected in ${file}`);
    } else if (!isValidUTF8(buf)) {
      val.error(`Invalid UTF-8 encoding in ${file}`);
    }
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
