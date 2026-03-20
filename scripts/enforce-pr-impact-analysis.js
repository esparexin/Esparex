#!/usr/bin/env node

const requiredPatterns = [
  { label: "Impact analysis header", pattern: /##\s*impact analysis/i },
  { label: "Affected module", pattern: /affected modules?\s*:/i },
  { label: "Affected API", pattern: /affected api\s*:/i },
  { label: "Affected DB schema", pattern: /affected db schema\s*:/i },
  { label: "Affected admin view", pattern: /affected admin view\s*:/i },
  { label: "Affected mobile flow", pattern: /affected mobile flow\s*:/i },
  { label: "Affected SSR page/route", pattern: /affected ssr(?:\s*page|\s*route|\s*page\/route)\s*:/i },
  { label: "Affected caching", pattern: /affected caching\s*:/i },
];

const prBody = process.env.PR_BODY || "";

if (!prBody.trim()) {
  console.error("❌ PR impact analysis guard failed: empty PR description.");
  console.error(
    "Add the impact analysis section from .github/pull_request_template.md before merging."
  );
  process.exit(1);
}

const missing = requiredPatterns.filter((entry) => !entry.pattern.test(prBody));

if (missing.length > 0) {
  console.error("❌ PR impact analysis guard failed. Missing required fields:");
  for (const entry of missing) {
    console.error(`- ${entry.label}`);
  }
  console.error(
    "\nFill the 'Impact Analysis' section in .github/pull_request_template.md."
  );
  process.exit(1);
}

console.log("✅ PR impact analysis guard passed.");
