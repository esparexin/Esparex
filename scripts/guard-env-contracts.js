#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = process.cwd();

const fileExists = (relativePath) => fs.existsSync(path.join(repoRoot, relativePath));
const readFile = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const lineHasVarAssignment = (content, variableName) => {
  const pattern = new RegExp(`^\\s*${variableName}\\s*=`, 'm');
  return pattern.test(content);
};
const fileContainsPattern = (content, pattern) => pattern.test(content);

const collectVarAssignments = (content, variableName) => {
  const pattern = new RegExp(`^\\s*${variableName}\\s*=\\s*(.*)$`, 'gm');
  const values = [];
  let match = pattern.exec(content);
  while (match) {
    values.push((match[1] || '').trim());
    match = pattern.exec(content);
  }
  return values;
};

const errors = [];

const disallowedVariables = [
  'NEXT_PUBLIC_APP_VERSION',
  'NEXT_PUBLIC_USE_DEFAULT_OTP',
  'SMOKE_ADMIN_FRONTEND_URL',
  'NEXT_PUBLIC_ENCRYPTION_KEY',
  'ENABLE_LEGACY_MODERATION_ALIASES',
];

const filesToScanForDisallowed = [
  '.github/workflows/ci.yml',
  'apps/admin/.env.local.example',
  'apps/admin/.env.production.example',
  'apps/web/.env.local.example',
  'apps/web/.env.production.example',
  'apps/web/.env.test',
  'apps/mobile/.env.local',
  'apps/mobile/.env.production',
  'backend/user/.env.example',
  'backend/user/.env.production.example',
];

const requiredAppEnvFiles = [
  'apps/admin/.env.local.example',
  'apps/admin/.env.production.example',
  'apps/web/.env.local.example',
  'apps/web/.env.production.example',
  'apps/web/.env.test',
  'apps/mobile/.env.local',
  'apps/mobile/.env.production',
];

const webEnvFiles = [
  'apps/web/.env.local.example',
  'apps/web/.env.production.example',
  'apps/web/.env.test',
  'apps/web/.env.local',
  'apps/web/.env.production',
];

const mobileEnvFiles = [
  'apps/mobile/.env.local',
  'apps/mobile/.env.production',
];

const apiUrlContractMarkers = [
  {
    filePath: '.github/workflows/ci.yml',
    pattern: /NEXT_PUBLIC_API_URL\s*:\s*.+/,
    message:
      '.github/workflows/ci.yml: missing NEXT_PUBLIC_API_URL in CI environment contract',
  },
  {
    filePath: 'apps/web/.env.local.example',
    pattern: /^\s*NEXT_PUBLIC_API_URL\s*=/m,
    message:
      'apps/web/.env.local.example: missing NEXT_PUBLIC_API_URL',
  },
  {
    filePath: 'apps/web/.env.production.example',
    pattern: /^\s*NEXT_PUBLIC_API_URL\s*=/m,
    message:
      'apps/web/.env.production.example: missing NEXT_PUBLIC_API_URL',
  },
  {
    filePath: 'render.yaml',
    pattern: /NEXT_PUBLIC_API_URL/,
    message:
      'render.yaml: missing NEXT_PUBLIC_API_URL reference for parity contract documentation',
  },
];

for (const filePath of filesToScanForDisallowed) {
  if (!fileExists(filePath)) continue;
  const content = readFile(filePath);
  for (const variableName of disallowedVariables) {
    if (lineHasVarAssignment(content, variableName)) {
      errors.push(`${filePath}: disallowed variable ${variableName} is present`);
    }
  }
}

for (const filePath of requiredAppEnvFiles) {
  if (!fileExists(filePath)) continue;
  const content = readFile(filePath);
  if (!lineHasVarAssignment(content, 'NEXT_PUBLIC_APP_ENV')) {
    errors.push(`${filePath}: missing required NEXT_PUBLIC_APP_ENV`);
  }
}

for (const filePath of webEnvFiles) {
  if (!fileExists(filePath)) continue;
  const content = readFile(filePath);
  if (lineHasVarAssignment(content, 'NEXT_PUBLIC_ADMIN_API_URL')) {
    errors.push(`${filePath}: NEXT_PUBLIC_ADMIN_API_URL must not be defined in web env files`);
  }
  if (lineHasVarAssignment(content, 'CAPACITOR_SERVER_URL')) {
    errors.push(`${filePath}: CAPACITOR_SERVER_URL must only be defined in mobile env files`);
  }
}

for (const filePath of mobileEnvFiles) {
  if (!fileExists(filePath)) continue;
  const content = readFile(filePath);
  if (!lineHasVarAssignment(content, 'CAPACITOR_SERVER_URL')) {
    errors.push(`${filePath}: missing required CAPACITOR_SERVER_URL`);
  }
  if (lineHasVarAssignment(content, 'NEXT_PUBLIC_ADMIN_API_URL')) {
    errors.push(`${filePath}: NEXT_PUBLIC_ADMIN_API_URL must not be defined in mobile env files`);
  }
}

for (const contract of apiUrlContractMarkers) {
  if (!fileExists(contract.filePath)) continue;
  const content = readFile(contract.filePath);
  if (!fileContainsPattern(content, contract.pattern)) {
    errors.push(contract.message);
  }
}

const webVercelConfigPath = 'apps/web/vercel.json';
if (fileExists(webVercelConfigPath)) {
  try {
    const parsed = JSON.parse(readFile(webVercelConfigPath));
    const apiUrl = parsed?.env?.NEXT_PUBLIC_API_URL;
    if (typeof apiUrl !== 'string' || apiUrl.trim().length === 0) {
      errors.push(
        `${webVercelConfigPath}: missing env.NEXT_PUBLIC_API_URL in Vercel build contract`
      );
    }
  } catch {
    errors.push(`${webVercelConfigPath}: invalid JSON`);
  }
}

const productionFiles = [
  'apps/web/.env.production',
  'apps/web/.env.production.example',
  'apps/admin/.env.production.example',
  'apps/mobile/.env.production',
  'backend/user/.env.production.example',
];

for (const filePath of productionFiles) {
  if (!fileExists(filePath)) continue;
  const content = readFile(filePath);
  for (const value of collectVarAssignments(content, 'PROD_RISK_OVERRIDE')) {
    if (value.toLowerCase() === 'true') {
      errors.push(`${filePath}: PROD_RISK_OVERRIDE must be false in production files`);
    }
  }
  for (const value of collectVarAssignments(content, 'NEXT_PUBLIC_PROD_RISK_OVERRIDE')) {
    if (value.toLowerCase() === 'true') {
      errors.push(`${filePath}: NEXT_PUBLIC_PROD_RISK_OVERRIDE must be false in production files`);
    }
  }
}

if (fileExists('backend/user/.env.example')) {
  const envExample = readFile('backend/user/.env.example');
  const tzCount = collectVarAssignments(envExample, 'TZ').length;
  if (tzCount > 1) {
    errors.push('backend/user/.env.example: TZ is duplicated');
  }
}

if (errors.length > 0) {
  console.error('\n[guard:env-contracts] Failed:\n');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('[guard:env-contracts] Environment contract checks passed.');
