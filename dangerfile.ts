import { danger, warn, fail, message } from "danger";

const pr = danger.github.pr;

// 1. Missing tests
const hasTests = danger.git.modified_files.some(f => f.includes(".spec.ts") || f.includes(".test.ts"));
const isSrcChange = danger.git.modified_files.some(f => f.startsWith("core/src") || f.startsWith("backend/") || f.startsWith("apps/"));

if (isSrcChange && !hasTests) {
  warn("No tests were modified or added in this PR. Consider adding tests for these changes.");
}

// 2. Large PRs
if (danger.github.pr.additions + danger.github.pr.deletions > 500) {
  warn("Big PR! This PR has > 500 lines of code changes. Consider breaking it into smaller PRs for easier review.");
}

// 3. Missing screenshots for UI changes
const hasAppChanges = danger.git.modified_files.some(f => f.startsWith("apps/web/") || f.startsWith("apps/admin/"));
if (hasAppChanges && !pr.body.includes("![") && !pr.body.includes("<img")) {
  warn("This PR modifies frontend apps but doesn't include any screenshots in the description.");
}

// 4. Missing PR description
if (pr.body.length < 10) {
  fail("Please provide a meaningful PR description.");
}
