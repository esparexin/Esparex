import mongoose from 'mongoose';
import Business from '../models/Business';
import { assignDefaultPlan } from '../services/business/BusinessSubscriptionService';
import logger from '../utils/logger';

/**
 * ONE-TIME BACKFILL SCRIPT: Business Base Plan Assignment
 *
 * Assigns the default Business Base plan (isDefault:true, userType:business)
 * to all existing approved (status: LIVE) business accounts in the database
 * and triggers a priority score sync on their listings.
 *
 * Safe and idempotent to run multiple times (upserts UserPlan records).
 *
 * Usage:
 *   npx tsx core/src/scripts/backfillBusinessPlans.ts
 */
export async function runBackfill(): Promise<{ total: number; succeeded: number; failed: number }> {
    logger.info('Starting business plan backfill...');

    const liveBusinesses = await Business.find({ status: 'LIVE' })
        .select('_id userId name')
        .lean();

    logger.info(`Found ${liveBusinesses.length} LIVE business accounts to process.`);

    let succeeded = 0;
    let failed = 0;

    for (const biz of liveBusinesses) {
        if (!biz.userId) {
            logger.warn(`Skipping business ${biz._id} — no userId found.`);
            failed++;
            continue;
        }

        try {
            await assignDefaultPlan(biz.userId.toString());
            succeeded++;
        } catch (err) {
            logger.error(`Failed to assign default plan to business ${biz._id} (user ${biz.userId})`, {
                error: err instanceof Error ? err.message : String(err),
            });
            failed++;
        }
    }

    logger.info(`Business plan backfill complete. Total: ${liveBusinesses.length}, Succeeded: ${succeeded}, Failed: ${failed}`);
    return { total: liveBusinesses.length, succeeded, failed };
}

// Script entrypoint when executed directly
if (require.main === module) {
    runBackfill()
        .then(() => process.exit(0))
        .catch((err) => {
            logger.error('Backfill script failed with fatal error', { error: String(err) });
            process.exit(1);
        });
}
