/**
 * Feed Visibility Integrity Remediation (idempotent)
 *
 * Problem:
 *   Ads may have inconsistent feed-visibility flags due to race conditions,
 *   crashed jobs, or schema changes. This migration detects and fixes:
 *
 *   1. Spotlight enabled on non-live listings
 *      → isSpotlight=true on expired/deactivated/rejected → set false
 *
 *   2. isBoosted enabled on non-live listings
 *      → isBoosted=true on non-live → set false
 *
 *   3. Live listings soft-deleted (isDeleted=true)
 *      → status='live' AND isDeleted=true → set status='deactivated'
 *      (admin will need to review and re-approve if appropriate)
 *
 *   4. feedVisibility mismatch
 *      → feedVisibility='visible' on non-live listings → set 'hidden'
 *
 * Usage:
 *   npm run ts-node src/scripts/migrations/remediate_feed_visibility_integrity.ts -- --dry-run
 *   npm run ts-node src/scripts/migrations/remediate_feed_visibility_integrity.ts -- --apply
 */

import mongoose from 'mongoose';
import { env } from '../../config/env';
import logger from '../../utils/logger';

const isApply = process.argv.includes('--apply');

type Summary = {
    mode: 'dry-run' | 'apply';
    spotlightOnNonLive: number;
    spotlightCleared: number;
    boostedOnNonLive: number;
    boostedCleared: number;
    liveButDeleted: number;
    liveButDeletedDeactivated: number;
    feedVisibilityMismatch: number;
    feedVisibilityFixed: number;
};

async function run() {
    await mongoose.connect(env.MONGODB_URI);
    logger.info(`[remediate_feed_visibility_integrity] mode=${isApply ? 'APPLY' : 'DRY-RUN'}`);

    const db = mongoose.connection.db!;
    const ads = db.collection('ads');

    const summary: Summary = {
        mode: isApply ? 'apply' : 'dry-run',
        spotlightOnNonLive: 0,
        spotlightCleared: 0,
        boostedOnNonLive: 0,
        boostedCleared: 0,
        liveButDeleted: 0,
        liveButDeletedDeactivated: 0,
        feedVisibilityMismatch: 0,
        feedVisibilityFixed: 0,
    };

    // 1. Spotlight on non-live
    const spotlightFilter = {
        isSpotlight: true,
        status: { $ne: 'live' },
    };
    summary.spotlightOnNonLive = await ads.countDocuments(spotlightFilter);
    if (isApply && summary.spotlightOnNonLive > 0) {
        const result = await ads.updateMany(spotlightFilter, { $set: { isSpotlight: false } });
        summary.spotlightCleared = result.modifiedCount;
    }

    // 2. Boosted on non-live
    const boostedFilter = {
        isBoosted: true,
        status: { $ne: 'live' },
    };
    summary.boostedOnNonLive = await ads.countDocuments(boostedFilter);
    if (isApply && summary.boostedOnNonLive > 0) {
        const result = await ads.updateMany(boostedFilter, { $set: { isBoosted: false } });
        summary.boostedCleared = result.modifiedCount;
    }

    // 3. Live but soft-deleted
    const liveDeletedFilter = {
        status: 'live',
        isDeleted: true,
    };
    summary.liveButDeleted = await ads.countDocuments(liveDeletedFilter);
    if (isApply && summary.liveButDeleted > 0) {
        const result = await ads.updateMany(liveDeletedFilter, {
            $set: {
                status: 'deactivated',
                deactivatedAt: new Date(),
            },
        });
        summary.liveButDeletedDeactivated = result.modifiedCount;
    }

    // 4. feedVisibility='visible' on non-live listings
    const feedVisFilter = {
        feedVisibility: 'visible',
        status: { $ne: 'live' },
    };
    summary.feedVisibilityMismatch = await ads.countDocuments(feedVisFilter);
    if (isApply && summary.feedVisibilityMismatch > 0) {
        const result = await ads.updateMany(feedVisFilter, { $set: { feedVisibility: 'hidden' } });
        summary.feedVisibilityFixed = result.modifiedCount;
    }

    logger.info('[remediate_feed_visibility_integrity] summary', summary);
    console.log(JSON.stringify(summary, null, 2));

    if (!isApply) {
        const totalIssues =
            summary.spotlightOnNonLive +
            summary.boostedOnNonLive +
            summary.liveButDeleted +
            summary.feedVisibilityMismatch;
        if (totalIssues > 0) {
            logger.info('[remediate_feed_visibility_integrity] Re-run with --apply to commit changes');
        } else {
            logger.info('[remediate_feed_visibility_integrity] No integrity issues found');
        }
    }

    await mongoose.disconnect();
}

run().catch((err) => {
    logger.error('[remediate_feed_visibility_integrity] Fatal error', { error: String(err) });
    process.exit(1);
});
