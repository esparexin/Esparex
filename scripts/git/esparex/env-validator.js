#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Validation, runStandalone, ROOT } = require('../shared');

const META = { id: 'ENV-001', name: 'Environment Validation', version: '1.0.0', category: 'Configuration' };

const APPROVED_ENV_VARS = new Set([
  'NODE_ENV', 'PORT', 'HOST',
  'MONGODB_URI', 'MONGO_URI', 'MONGO_DB_NAME',
  'REDIS_URL', 'REDIS_HOST', 'REDIS_PORT',
  'JWT_SECRET', 'JWT_EXPIRES_IN',
  'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_S3_BUCKET',
  'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PUBLISHABLE_KEY',
  'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET',
  'SENTRY_DSN', 'SENTRY_ENVIRONMENT',
  'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM',
  'NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_API_URL',
  'FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL',
  'GOOGLE_MAPS_API_KEY',
  'OPENAI_API_KEY',
  'LOG_LEVEL', 'ENCRYPTION_KEY',
  'CI', 'VERCEL', 'RENDER',
  'SKIP_ENV_VALIDATION', 'NEXT_DISABLE_WEBPACK_CACHE',
  'NODE_OPTIONS', 'ALLOW_DB_CONNECT',
]);

function run(val) {
  const changedFiles = (() => {
    try {
      const out = execSync('git diff --cached --name-only --diff-filter=ACMR', { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      return out.split('\n').filter(Boolean);
    } catch { return []; }
  })();

  const srcFiles = changedFiles.filter(f => /\.(ts|tsx|js|jsx)$/.test(f) && !f.includes('node_modules'));
  if (srcFiles.length === 0) return;

  const pattern = /process\.env\.([A-Z_][A-Z0-9_]*)/g;

  for (const file of srcFiles) {
    const fullPath = path.join(ROOT, file);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf-8');
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (!APPROVED_ENV_VARS.has(match[1])) {
        val.warning(`Unapproved env var "${match[1]}" in ${file}. Add to APPROVED_ENV_VARS if intentional.`);
      }
    }
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
