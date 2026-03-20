const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(projectRoot, 'src');
const registryPath = path.resolve(projectRoot, '../shared/constants/image-domain-registry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

const nextRemotePatterns = Array.isArray(registry.nextRemotePatterns) ? registry.nextRemotePatterns : [];
const allowedHostPatterns = nextRemotePatterns
  .map((pattern) => pattern && pattern.hostname)
  .filter((hostname) => typeof hostname === 'string' && hostname.length > 0);

const wildcardPatternToRegex = (pattern) => {
  let escaped = '';
  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i];
    const next = pattern[i + 1];
    if (char === '*' && next === '*') {
      escaped += '.*';
      i += 1;
      continue;
    }
    if (char === '*') {
      escaped += '[^.]+';
      continue;
    }
    if (/[.+?^${}()|[\]\\]/.test(char)) {
      escaped += `\\${char}`;
      continue;
    }
    escaped += char;
  }
  return new RegExp(`^${escaped}$`, 'i');
};

const allowedHostRegexes = allowedHostPatterns.map(wildcardPatternToRegex);

const isAllowedHost = (hostname) =>
  allowedHostRegexes.some((regex) => regex.test(hostname));

const walk = (dir, files = []) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
};

const files = walk(srcRoot);
const issues = [];
const dynamicSrcIssues = [];
const imageLiteralRegex = /<Image[\s\S]*?\bsrc\s*=\s*(['"`])((?:https?:)?\/\/[^'"`]+)\1/gm;
const imageTagRegex = /<(Image|img)\b[\s\S]*?>/gm;
const dynamicSrcRegex = /\bsrc\s*=\s*\{([\s\S]*?)\}/m;
const safeDynamicSourceRegex = /\btoSafeImageSrc\s*\(|\bsafe[A-Z_a-z0-9]*\b|\bDEFAULT_IMAGE_PLACEHOLDER\b/;
const suspiciousImageMemberRegex =
  /(?:^|\.)(?:image|images|imageUrl|avatar|logo|logoUrl|coverImage|profilePhoto|photo|url)\b/i;

for (const filePath of files) {
  const content = fs.readFileSync(filePath, 'utf8');
  let match;
  while ((match = imageLiteralRegex.exec(content)) !== null) {
    const rawUrl = match[2];
    if (!rawUrl) continue;

    const absoluteUrl = rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
    let parsed;
    try {
      parsed = new URL(absoluteUrl);
    } catch {
      continue;
    }

    if (!isAllowedHost(parsed.hostname)) {
      const line = content.slice(0, match.index).split('\n').length;
      issues.push(`${path.relative(projectRoot, filePath)}:${line} -> ${absoluteUrl}`);
    }
  }

  let tagMatch;
  while ((tagMatch = imageTagRegex.exec(content)) !== null) {
    const tagSource = tagMatch[0];
    const dynamicSrc = tagSource.match(dynamicSrcRegex);
    if (!dynamicSrc || !dynamicSrc[1]) continue;

    const expression = dynamicSrc[1].trim();
    if (!expression) continue;
    if (safeDynamicSourceRegex.test(expression)) continue;
    if (!expression.includes('.')) continue;
    if (!suspiciousImageMemberRegex.test(expression)) continue;

    const line = content.slice(0, tagMatch.index).split('\n').length;
    dynamicSrcIssues.push(
      `${path.relative(projectRoot, filePath)}:${line} -> src={${expression}}`
    );
  }
}

if (issues.length > 0 || dynamicSrcIssues.length > 0) {
  console.error('Image safety validation failed.');
  console.error('\nUnauthorized image domains detected in <Image src=\"...\"> literals:');
  if (issues.length === 0) {
    console.error(' - none');
  } else {
    for (const issue of issues) {
      console.error(` - ${issue}`);
    }
  }

  if (dynamicSrcIssues.length > 0) {
    console.error('\nUnsafe dynamic image src usage detected. Wrap backend values with toSafeImageSrc():');
    for (const issue of dynamicSrcIssues) {
      console.error(` - ${issue}`);
    }
  }

  process.exit(1);
}

console.log('Image domain validation passed.');
