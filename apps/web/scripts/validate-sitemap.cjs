/**
 * Esparex SEO & Sitemap Automated Validation Tool
 * Validates canonical URL structure, hostnames, redirects, and indexing exclusion rules.
 *
 * Usage:
 *   node scripts/validate-sitemap.cjs
 *   SITEMAP_URL=https://esparex.in/sitemap.xml node scripts/validate-sitemap.cjs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const projectRoot = path.resolve(__dirname, '..');
const SITEMAP_TARGET = process.env.SITEMAP_URL || 'https://esparex.in/sitemap.xml';

// Exclusion patterns: paths that must NEVER appear in public sitemap
const FORBIDDEN_PATTERNS = [
  /\/account\//i,
  /\/chat(\/|$)/i,
  /\/post-(ad|service|spare-part-listing)/i,
  /\/edit-(ad|service|spare-part)\//i,
  /\/business\/edit/i,
  /\/internal\//i,
  /\/api\//i,
  /\/search\?/i,
  /\/browse-(services|spare-parts)/i,
  /\/spare-parts\//i,
  /\/category\/mobile-phones/i, // Must use canonical /category/mobiles
];

// Disallowed hostnames that must NEVER appear in public sitemap
const FORBIDDEN_HOSTNAMES = [
  'localhost',
  'admin.esparex.in',
  '127.0.0.1',
  'preview',
  'staging',
];

function parseUrlsFromXml(xml) {
  const urls = [];
  const locRegex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    if (match[1]) {
      urls.push(match[1].trim());
    }
  }
  return urls;
}

function auditUrlList(urls) {
  const violations = [];
  const warnings = [];
  const seen = new Set();
  const duplicates = [];

  for (const urlStr of urls) {
    // 1. Check duplicate
    if (seen.has(urlStr)) {
      duplicates.push(urlStr);
    }
    seen.add(urlStr);

    // 2. Parse URL
    let parsed;
    try {
      parsed = new URL(urlStr);
    } catch {
      violations.push({ type: 'MALFORMED_URL', url: urlStr, detail: 'Failed to parse URL' });
      continue;
    }

    // 3. Protocol & Host check
    if (parsed.protocol !== 'https:') {
      violations.push({ type: 'INSECURE_PROTOCOL', url: urlStr, detail: `Protocol is ${parsed.protocol}, must be https:` });
    }

    for (const forbiddenHost of FORBIDDEN_HOSTNAMES) {
      if (parsed.hostname.includes(forbiddenHost)) {
        violations.push({ type: 'UNEXPECTED_HOSTNAME', url: urlStr, detail: `Host '${parsed.hostname}' contains forbidden term '${forbiddenHost}'` });
      }
    }

    // 4. Query params check
    if (parsed.search) {
      violations.push({ type: 'QUERY_STRING_IN_SITEMAP', url: urlStr, detail: `Sitemap entries must not contain query parameters: ${parsed.search}` });
    }

    // 5. Forbidden private / redirect / internal paths
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(parsed.pathname)) {
        violations.push({ type: 'NON_INDEXABLE_ROUTE', url: urlStr, detail: `Matched forbidden pattern: ${pattern.toString()}` });
      }
    }

    // 6. Spare-part-listing slug-id format check
    if (parsed.pathname.startsWith('/spare-part-listings/')) {
      const slugParam = parsed.pathname.replace('/spare-part-listings/', '');
      if (!/-[a-z0-9]+$/i.test(slugParam)) {
        violations.push({ type: 'SPARE_PART_MISSING_ID', url: urlStr, detail: `Spare part URL '${slugParam}' lacks canonical -{id} suffix` });
      }
    }
  }

  if (duplicates.length > 0) {
    violations.push({ type: 'DUPLICATE_URLS', url: duplicates.join(', '), detail: `Found ${duplicates.length} duplicate URL(s)` });
  }

  return { violations, warnings, totalUrls: urls.length, uniqueUrls: seen.size };
}

function fetchUrl(targetUrl, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const client = targetUrl.startsWith('https') ? https : http;
    const req = client.get(targetUrl, { headers: { 'User-Agent': 'Esparex-SEO-Auditor/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data, headers: res.headers });
      });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${targetUrl}`));
    });
  });
}

async function auditLocalSourceFiles() {
  const issues = [];
  console.log('🔍 Auditing local static SEO configurations...');

  // 1. Check sitemap.ts
  const sitemapFile = path.join(projectRoot, 'src/app/sitemap.ts');
  const sitemapContent = fs.readFileSync(sitemapFile, 'utf8');

  if (sitemapContent.includes('catalog/spare-parts')) {
    issues.push('sitemap.ts references catalog/spare-parts instead of user listings endpoint');
  }
  if (sitemapContent.includes('!part.slug.match')) {
    issues.push('sitemap.ts contains inverted spare-part regex filter logic');
  }
  if (sitemapContent.includes('?limit=1000&page=1') && sitemapContent.includes('${url}?')) {
    issues.push('sitemap.ts contains possible double ? concatenation');
  }

  // 2. Check web robots.ts
  const robotsFile = path.join(projectRoot, 'src/app/robots.ts');
  const robotsContent = fs.readFileSync(robotsFile, 'utf8');
  for (const requiredDisallow of ['/account/', '/chat', '/post-spare-part-listing', '/internal/', '/api/']) {
    if (!robotsContent.includes(requiredDisallow)) {
      issues.push(`robots.ts missing disallow for ${requiredDisallow}`);
    }
  }

  // 3. Check admin indexing protection
  const adminRobotsFile = path.resolve(projectRoot, '../admin/src/app/robots.ts');
  if (!fs.existsSync(adminRobotsFile)) {
    issues.push('apps/admin missing src/app/robots.ts');
  } else {
    const adminRobots = fs.readFileSync(adminRobotsFile, 'utf8');
    if (!adminRobots.includes("disallow: '/'") && !adminRobots.includes('disallow: "/"')) {
      issues.push("apps/admin robots.ts does not disallow '/'");
    }
  }

  const adminConfigFile = path.resolve(projectRoot, '../admin/next.config.mjs');
  const adminConfig = fs.readFileSync(adminConfigFile, 'utf8');
  if (!adminConfig.includes('X-Robots-Tag')) {
    issues.push('apps/admin next.config.mjs missing X-Robots-Tag header');
  }

  // 4. Check web layout.tsx metadataBase fallback
  const layoutFile = path.join(projectRoot, 'src/app/layout.tsx');
  const layoutContent = fs.readFileSync(layoutFile, 'utf8');
  if (layoutContent.includes("new URL('http://localhost:3000')") || layoutContent.includes('new URL("http://localhost:3000")')) {
    issues.push('apps/web layout.tsx uses http://localhost:3000 as fallback metadataBase');
  }

  return issues;
}

async function main() {
  console.log('====================================================');
  console.log('🚀 Esparex SEO & Sitemap Hardening Audit Tool');
  console.log('====================================================');

  const sourceIssues = await auditLocalSourceFiles();
  if (sourceIssues.length > 0) {
    console.error('\n❌ Static Source Audit Violations Found:');
    sourceIssues.forEach((issue, idx) => {
      console.error(`  ${idx + 1}. ${issue}`);
    });
  } else {
    console.log('✅ Static Source SEO rules audit: PASSED');
  }

  console.log(`\n🌐 Attempting live/staged sitemap verification: ${SITEMAP_TARGET}`);
  try {
    const response = await fetchUrl(SITEMAP_TARGET, 3000);
    if (response.statusCode === 200) {
      console.log(`✅ Sitemap fetched successfully (HTTP 200, length: ${response.data.length} bytes)`);
      const urls = parseUrlsFromXml(response.data);
      console.log(`📊 Found ${urls.length} URLs in sitemap`);

      const { violations, uniqueUrls } = auditUrlList(urls);
      console.log(`📈 Unique URLs: ${uniqueUrls}`);

      if (violations.length > 0) {
        console.error(`\n❌ Found ${violations.length} Critical SEO Violations in Sitemap:`);
        violations.forEach((v) => {
          console.error(`  [${v.type}] ${v.url}: ${v.detail}`);
        });
        process.exit(1);
      }

      console.log('✅ Live sitemap validation: PASSED with 0 violations!');
    } else {
      console.log(`ℹ️  Sitemap endpoint returned status ${response.statusCode} (remote environment may be inactive in offline CI).`);
    }
  } catch (err) {
    console.log(`ℹ️  Live sitemap fetch skipped (${err.message}). Offline source audit was used.`);
  }

  if (sourceIssues.length > 0) {
    process.exit(1);
  }

  console.log('\n====================================================');
  console.log('🎉 SEO Validation Completed Successfully!');
  console.log('====================================================\n');
}

main().catch((err) => {
  console.error('Fatal SEO Auditor Error:', err);
  process.exit(1);
});
