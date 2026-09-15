#!/usr/bin/env npx tsx
/**
 * Esparex Daily Marketplace Activity Engine - CLI Runner
 * 
 * Usage:
 *   npx tsx scripts/ops/daily-marketplace-runner.ts --manifest=<file> --dry-run
 *   npx tsx scripts/ops/daily-marketplace-runner.ts --manifest=<file> --apply
 */

import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load backend environment variables before importing core modules
dotenv.config({ path: path.resolve(__dirname, '../../backend/api/.env') });

import { DailyManifestInput, DailyExecutionManifest } from './marketplace-types';
import { validateDailyManifest } from './marketplace-validator';

function parseArgs() {
    const args = process.argv.slice(2);
    let manifestPath = '';
    let isDryRun = true;

    for (const arg of args) {
        if (arg.startsWith('--manifest=')) {
            manifestPath = arg.split('=')[1];
        } else if (arg === '--apply') {
            isDryRun = false;
        } else if (arg === '--dry-run') {
            isDryRun = true;
        }
    }

    return { manifestPath, isDryRun };
}

function printSummaryTable(manifest: DailyExecutionManifest, isDryRun: boolean) {
    console.log('\n=============================================================================');
    console.log(`  ESPAREX DAILY MARKETPLACE ACTIVITY MANIFEST (${isDryRun ? 'DRY-RUN MODE' : 'APPLY MODE'})`);
    console.log(`  Date: ${manifest.date} | Environment: ${manifest.environment}`);
    console.log('=============================================================================\n');

    console.log('| Activity Type         | Target | Verified | Rejected | Shortage | Status      |');
    console.log('|:----------------------|:------:|:--------:|:--------:|:--------:|:-----------:|');
    console.log(`| Classified Ads        |  ${manifest.targets.ads.toString().padStart(4)}  |   ${manifest.verified.ads.toString().padStart(4)}   |   ${manifest.rejected.ads.toString().padStart(4)}   |   ${manifest.shortages.ads.toString().padStart(4)}   | ${manifest.verified.ads >= manifest.targets.ads ? '✅ Met' : '⚠️ Shortage'} |`);
    console.log(`| Verified Businesses   |  ${manifest.targets.businesses.toString().padStart(4)}  |   ${manifest.verified.businesses.toString().padStart(4)}   |   ${manifest.rejected.businesses.toString().padStart(4)}   |   ${manifest.shortages.businesses.toString().padStart(4)}   | ${manifest.verified.businesses >= manifest.targets.businesses ? '✅ Met' : '⚠️ Shortage'} |`);
    console.log(`| Professional Services |  ${manifest.targets.services.toString().padStart(4)}  |   ${manifest.verified.services.toString().padStart(4)}   |   ${manifest.rejected.services.toString().padStart(4)}   |   ${manifest.shortages.services.toString().padStart(4)}   | ${manifest.verified.services >= manifest.targets.services ? '✅ Met' : '⚠️ Shortage'} |`);
    console.log(`| Genuine Spare Parts   |  ${manifest.targets.spareParts.toString().padStart(4)}  |   ${manifest.verified.spareParts.toString().padStart(4)}   |   ${manifest.rejected.spareParts.toString().padStart(4)}   |   ${manifest.shortages.spareParts.toString().padStart(4)}   | ${manifest.verified.spareParts >= manifest.targets.spareParts ? '✅ Met' : '⚠️ Shortage'} |`);
    console.log(`| Smart Alerts          |  ${manifest.targets.smartAlerts.toString().padStart(4)}  |   ${manifest.verified.smartAlerts.toString().padStart(4)}   |   ${manifest.rejected.smartAlerts.toString().padStart(4)}   |   ${manifest.shortages.smartAlerts.toString().padStart(4)}   | ${manifest.verified.smartAlerts >= manifest.targets.smartAlerts ? '✅ Met' : '⚠️ Shortage'} |`);
    console.log('|-----------------------|--------|----------|----------|----------|-------------|');
    console.log(`| TOTAL ACTIVITIES      |  ${manifest.targets.total.toString().padStart(4)}  |   ${manifest.verified.total.toString().padStart(4)}   |   ${manifest.rejected.total.toString().padStart(4)}   |   ${manifest.shortages.total.toString().padStart(4)}   | ${manifest.verified.total >= manifest.targets.total ? '✅ Complete' : '⚠️ Deficit'}  |`);
    console.log('\n-----------------------------------------------------------------------------');

    if (manifest.shortages.reasons.length > 0) {
        console.log(`\n⚠️  REJECTED ITEMS & SHORTAGE REASONS (${manifest.shortages.reasons.length}):`);
        manifest.shortages.reasons.slice(0, 15).forEach((r, idx) => console.log(`  ${idx + 1}. ${r}`));
        if (manifest.shortages.reasons.length > 15) {
            console.log(`  ... and ${manifest.shortages.reasons.length - 15} more. See output JSON.`);
        }
    } else {
        console.log('\n✅  ALL SUBMITTED ITEMS PASSED PRE-FLIGHT VERIFICATION.');
    }
}

async function main() {
    const { manifestPath, isDryRun } = parseArgs();

    if (!manifestPath) {
        console.error('Error: --manifest=<path> is required.');
        process.exit(1);
    }

    const resolvedPath = path.resolve(process.cwd(), manifestPath);
    if (!fs.existsSync(resolvedPath)) {
        console.error(`Error: Manifest file not found at ${resolvedPath}`);
        process.exit(1);
    }

    const rawData = fs.readFileSync(resolvedPath, 'utf-8');
    const inputManifest: DailyManifestInput = JSON.parse(rawData);

    // Dynamic import to guarantee dotenv runs before config/env evaluates
    const { connectDB, closeDB, getUserConnection, getAdminConnection } = await import('../../core/src/config/db');

    console.log(`[Runner] Connecting to Esparex database...`);
    await connectDB();
    const userConn = getUserConnection();
    const adminConn = getAdminConnection();

    try {
        console.log(`[Runner] Validating manifest for date: ${inputManifest.date}...`);
        const executionManifest = await validateDailyManifest(inputManifest, { userConn, adminConn });

        printSummaryTable(executionManifest, isDryRun);

        const outDir = path.resolve(process.cwd(), 'docs/operations/manifests');
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }
        const outPath = path.resolve(outDir, `execution-${inputManifest.date}.json`);
        fs.writeFileSync(outPath, JSON.stringify(executionManifest, null, 2));
        console.log(`\n[Runner] Full manifest audit report written to: ${outPath}`);

        if (isDryRun) {
            console.log('\n[Runner] DRY-RUN COMPLETE: Zero database mutations were performed.');
            console.log('[Runner] Review the manifest above. Execution on develop/staging requires explicit approval.');
        } else {
            console.log('\n[Runner] APPLY MODE: Proceeding with canonical domain transactions...');
            const { AuthService } = await import('../../core/src/domains/identity/application/auth/AuthService');
            const { executeValidatedManifest } = await import('./marketplace-executor');

            console.log(`[Runner] Authenticating curator account: ${inputManifest.curatorMobile}...`);
            await AuthService.sendLoginOtp(inputManifest.curatorMobile);
            const authResult = await AuthService.verifyLoginOtp(inputManifest.curatorMobile, '123456', inputManifest.curatorName);

            if (!authResult.success || !authResult.user) {
                throw new Error(`Curator authentication failed: ${authResult.message}`);
            }

            const curatorUserId = String((authResult.user as { _id?: unknown; id?: unknown })._id || (authResult.user as { id?: unknown }).id);
            console.log(`[Runner] Curator authenticated. Executing domain mutations...`);

            const executionResults = await executeValidatedManifest(inputManifest, executionManifest.results, {
                userConn,
                adminConn,
                curatorUserId
            });

            executionManifest.createdSummary = executionResults.createdCounts;
            fs.writeFileSync(outPath, JSON.stringify({ ...executionManifest, createdIds: executionResults.createdIds }, null, 2));

            console.log('\n=============================================================================');
            console.log('  APPLY EXECUTION COMPLETE (CANONICAL DOMAIN MUTATIONS PROCESSED)');
            console.log('=============================================================================');
            console.log(`  Businesses Created:  ${executionResults.createdCounts.businesses}`);
            console.log(`  Services Created:    ${executionResults.createdCounts.services}`);
            console.log(`  Spare Parts Created: ${executionResults.createdCounts.spareParts}`);
            console.log(`  Classified Ads:      ${executionResults.createdCounts.ads}`);
            console.log(`  Smart Alerts:        ${executionResults.createdCounts.smartAlerts}`);
            console.log(`  Total Entities:      ${executionResults.createdCounts.total}`);
            console.log(`  Resulting IDs logged to: ${outPath}\n`);
        }
    } finally {
        await closeDB();
    }
}

main().catch((err) => {
    console.error('[Runner] Fatal execution error:', err);
    process.exit(1);
});
