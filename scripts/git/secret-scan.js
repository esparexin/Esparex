#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Validation, runStandalone, ROOT } = require('./shared');

const META = { id: 'SEC-001', name: 'Secret Scan', version: '1.0.0', category: 'Security' };

const ALLOWLIST_PATH = path.join(__dirname, 'config', 'secret-allowlist.json');
const allowlist = JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf-8'));

const ENV_FILE_PATTERNS = [
  '.env', '.env.local', '.env.production',
  '.env.development', '.env.staging',
];

const BINARY_SECRET_PATTERNS = [
  '*.pem', '*.key', '*.p12', '*.crt',
];

const SECRET_PATTERNS = [
  { pattern: /OPENAI_API_KEY=/, label: 'OPENAI_API_KEY' },
  { pattern: /MONGO_URI=/, label: 'MONGO_URI' },
  { pattern: /JWT_SECRET=/, label: 'JWT_SECRET' },
  { pattern: /STRIPE_SECRET_KEY=/, label: 'STRIPE_SECRET_KEY' },
  { pattern: /RAZORPAY_KEY_SECRET=/, label: 'RAZORPAY_KEY_SECRET' },
  { pattern: /AWS_SECRET_ACCESS_KEY=/, label: 'AWS_SECRET_ACCESS_KEY' },
  { pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/, label: 'PRIVATE KEY' },
  { pattern: /Bearer ey[A-Za-z0-9_-]+/, label: 'JWT Bearer token' },
  { pattern: /ghp_[A-Za-z0-9_]{36,}/, label: 'GitHub PAT' },
  { pattern: /sk-[A-Za-z0-9_]{20,}/, label: 'OpenAI API key (sk-)' },
];

function fileMatchesAny(file, patterns) {
  const basename = path.basename(file);
  for (const pat of patterns) {
    const parts = pat.split(/[\\/]/);
    const regexStr = parts.map(p => {
      if (p === '**') return '.*';
      return p.replace(/\*/g, '[^/]*').replace(/\?/g, '.');
    }).join('[\\\\/]');
    const re = new RegExp('^' + regexStr + '$', 'i');
    if (re.test(file) || re.test(basename) || file.endsWith(pat)) return true;
  }
  return false;
}

function isAllowed(file) {
  if (file.endsWith('.example')) return true;
  return fileMatchesAny(file, allowlist.testFilePatterns);
}

function run(val) {
  const stagedFiles = (() => {
    try {
      const out = execSync('git diff --cached --name-only', { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      return out.split('\n').filter(Boolean);
    } catch { return []; }
  })();

  const trackedFiles = (() => {
    try {
      const out = execSync('git ls-files', { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      return out.split('\n').filter(Boolean);
    } catch { return []; }
  })();

  const allScannableFiles = [...new Set([...stagedFiles, ...trackedFiles])];

  for (const file of allScannableFiles) {
    const fullPath = path.join(ROOT, file);
    if (!fs.existsSync(fullPath)) continue;
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) continue;

    if (!file.endsWith('.example') && fileMatchesAny(file, ENV_FILE_PATTERNS)) {
      val.error(`Sensitive file committed: ${file} (environment file)`);
    }

    if (fileMatchesAny(file, BINARY_SECRET_PATTERNS)) {
      val.error(`Sensitive file committed: ${file} (private key / certificate)`);
    }

    if (isAllowed(file)) continue;

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      for (const { pattern, label } of SECRET_PATTERNS) {
        if (pattern.test(content)) {
          val.error(`Secret pattern found in ${file}: ${label}`);
          break;
        }
      }
    } catch {
      val.info(`Cannot read ${file} as text — skipping.`);
    }
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
