#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const webRoot = path.resolve(__dirname, '..');
const sitemapPath = path.join(webRoot, 'src/app/sitemap.ts');
const robotsWebPath = path.join(webRoot, 'src/app/robots.ts');
const robotsAdminPath = path.resolve(webRoot, '../admin/src/app/robots.ts');
const canonicalHostPath = path.join(webRoot, 'src/lib/seo/canonicalHost.ts');

const errors = [];

// 1. Validate Canonical Host SSOT
if (!fs.existsSync(canonicalHostPath)) {
  errors.push('canonicalHost.ts does not exist.');
} else {
  const content = fs.readFileSync(canonicalHostPath, 'utf8');
  if (!content.includes('https://esparex.in')) {
    errors.push('canonicalHost.ts must define https://esparex.in as CANONICAL_ORIGIN.');
  }
}

// 2. Validate Sitemap Generator
if (!fs.existsSync(sitemapPath)) {
  errors.push('sitemap.ts does not exist.');
} else {
  const content = fs.readFileSync(sitemapPath, 'utf8');
  if (content.includes('http://localhost')) {
    errors.push('sitemap.ts contains forbidden localhost references.');
  }
  if (content.includes('admin.esparex.in')) {
    errors.push('sitemap.ts must not contain references to admin subdomain.');
  }
  if (!content.includes('CANONICAL_ORIGIN')) {
    errors.push('sitemap.ts must consume CANONICAL_ORIGIN SSOT.');
  }
}

// 3. Validate Web Robots
if (!fs.existsSync(robotsWebPath)) {
  errors.push('web robots.ts does not exist.');
} else {
  const content = fs.readFileSync(robotsWebPath, 'utf8');
  const requiredDisallows = ['/account/', '/chat', '/post-ad', '/api/', '/admin/'];
  for (const route of requiredDisallows) {
    if (!content.includes(`'${route}'`) && !content.includes(`"${route}"`)) {
      errors.push(`web robots.ts missing required disallow for ${route}`);
    }
  }
}

// 4. Validate Admin Robots
if (!fs.existsSync(robotsAdminPath)) {
  errors.push('admin robots.ts does not exist.');
} else {
  const content = fs.readFileSync(robotsAdminPath, 'utf8');
  if (!content.includes("disallow: '/'") && !content.includes('disallow: "/"')) {
    errors.push('admin robots.ts must disallow all crawlers (disallow: "/").');
  }
}

if (errors.length > 0) {
  console.error('❌ SEO & Sitemap Architecture Validation Failed:');
  errors.forEach((err) => console.error(`  - ${err}`));
  process.exit(1);
}

console.log('✅ SEO & Sitemap Architecture Validation Passed: Canonical host, robots, and sitemap verified.');
process.exit(0);
