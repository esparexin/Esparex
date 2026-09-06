#!/usr/bin/env npx tsx

/**
 * Listing Expiry & Cache Invalidation Sweep Script
 * Esparex Monorepo Maintenance Utility
 * 
 * Delegates directly to the canonical domain lifecycle service:
 * ListingExpiryService.runSweep()
 * 
 * Usage:
 *   npx tsx scripts/sweep-expired-listings.ts --dry-run
 *   npx tsx scripts/sweep-expired-listings.ts --apply
 */

import path from 'path';
import dotenv from 'dotenv';
import { LISTING_STATUS } from '@esparex/contracts';
import { connectDB, closeDB } from '../core/src/config/db';
import { ListingExpiryService } from '../core/src/services/lifecycle/ListingExpiryService';
import { getListingRepository } from '../core/src/composition/listings';
import { client as redisClient } from '../core/src/utils/redisCache';

dotenv.config({ path: path.resolve(__dirname, '../backend/api/.env') });
dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env.local') });

const isDryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');

async function run(): Promise<void> {
    console.log('\n======================================================');
    console.log(`  Esparex Listing Expiry Sweep (${isDryRun ? 'DRY RUN' : 'APPLY MODE'})`);
    console.log('  SSOT: ListingExpiryService.runSweep()');
    console.log('======================================================\n');

    const now = new Date();

    try {
        await connectDB();

        if (isDryRun) {
            console.log(`[Dry Run] Inspecting listings expiring on or before ${now.toISOString()}...`);
            const expiring = await getListingRepository().find({
                status: LISTING_STATUS.LIVE,
                expiresAt: { $lte: now },
                isDeleted: false,
            });

            console.log(`Found ${expiring.length} live listing(s) eligible for expiry sweep.`);
            if (expiring.length > 0) {
                console.log('Sample eligible listings:');
                expiring.slice(0, 10).forEach((item) => {
                    const expiresStr = item.expiresAt ? new Date(item.expiresAt).toISOString() : 'null';
                    console.log(`  - [${item.id}] ${item.title} (expiresAt: ${expiresStr})`);
                });
                if (expiring.length > 10) {
                    console.log(`  ... and ${expiring.length - 10} more.`);
                }
            }
            console.log('\nDry run complete. No database mutations were applied. Run with --apply to execute lifecycle sweep.');
        } else {
            console.log('[Apply] Executing canonical ListingExpiryService.runSweep()...');
            const result = await ListingExpiryService.runSweep(now);
            console.log('✅ Expiry sweep completed:');
            console.log(`   - Expired Count: ${result.expiredCount}`);
            console.log(`   - Touched Count: ${result.touchedCount}`);
            if (result.listingIds.length > 0) {
                console.log(`   - Listing IDs: ${result.listingIds.join(', ')}`);
            }
        }
    } catch (err) {
        console.error('❌ Expiry sweep failed:', err instanceof Error ? err.message : String(err));
        process.exitCode = 1;
    } finally {
        try {
            await closeDB();
        } catch {
            // ignore close errors
        }
        if (redisClient && redisClient.status !== 'end') {
            try {
                await redisClient.quit();
            } catch {
                // ignore redis quit errors
            }
        }
    }

    console.log('\n======================================================\n');
}

void run();

