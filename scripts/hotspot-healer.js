/**
 * 🩹 Esparex Hotspot Healer (v2 - Safe)
 * 
 * This version uses ONLY AST-aware tools (ESLint) to perform remediations.
 * It avoids dangerous regex-based transformations on quotes.
 */

const { execSync } = require('child_process');

const HOTSPOTS = [
    'backend/user/src/scripts/production_smoke_test.ts',
    'apps/web/src/context/AuthContext.tsx',
    'apps/web/src/app/(public)/terms/page.tsx',
    'apps/web/src/components/user/profile/tabs/MyListingsTab.tsx',
    'apps/web/src/components/user/useBrowseListingsController.ts',
    'core/src/jobs/suspendExpiredBusinesses.job.ts'
];

console.log('🩹 Starting Safe Hotspot Healing (v2)...');

HOTSPOTS.forEach(file => {
    console.log(`✨ Running eslint --fix on ${file}...`);
    try {
        // We use the --fix flag which is the only enterprise-safe way to heal
        execSync(`npx eslint "${file}" --fix`, { stdio: 'inherit' });
    } catch (e) {
        // ESLint exits with 1 if problems remain, that's expected
    }
});

console.log('\n✅ Safe Healing complete. Regenerating debt insights...');
execSync('npm run debt:baseline && npm run debt:insights', { stdio: 'inherit' });
