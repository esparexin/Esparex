/**
 * 🔍 ADMIN FETCH AUDIT SCRIPT
 * 
 * Purpose: Ensures all `adminFetch` calls use `ADMIN_ROUTES` constants instead of raw strings.
 * Usage: npx ts-node scripts/audit-admin-fetch.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.join(process.cwd(), 'src');
const VIOLATION_REGEX = /adminFetch\s*<\s*[^>]*\s*>\s*\(\s*['"`]\//g;
const EXEMPTIONS = [
    'FirebaseDiagnostic.tsx', // Explicitly exempted for raw API testing
];

function scanDirectory(dir: string): string[] {
    const results: string[] = [];
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            results.push(...scanDirectory(fullPath));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            if (EXEMPTIONS.some(e => fullPath.endsWith(e))) continue;

            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');

            lines.forEach((line, index) => {
                if (line.match(VIOLATION_REGEX)) {
                    results.push(`${fullPath}:${index + 1} - Raw string used in adminFetch`);
                }
            });
        }
    }

    return results;
}

console.log('🚀 Starting adminFetch Audit...');
const violations = scanDirectory(SRC_DIR);

if (violations.length > 0) {
    console.error('❌ Found violations:');
    violations.forEach(v => console.log('  ' + v));
    console.log('\n💡 Tip: Use ADMIN_ROUTES constants instead of raw string literals.');
    process.exit(1);
} else {
    console.log('✅ No violations found. adminFetch usage is standardized!');
    process.exit(0);
}
