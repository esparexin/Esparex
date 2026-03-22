/**
 * Moderation Status Enum Remediation (idempotent)
 *
 * Problem:
 *   Some Ad documents have `moderationStatus: "approved"` — a legacy value that
 *   was written before the enum was tightened. The current model only allows:
 *   ['auto_approved', 'held_for_review', 'manual_approved', 'rejected', 'community_hidden']
 *
 *   Mongoose validates the entire document on .save(), so any mutation
 *   (deactivate, reject, expire, etc.) against one of these docs throws:
 *   "Ad validation failed: moderationStatus: `approved` is not a valid enum value"
 *
 * Fix:
 *   "approved" → "manual_approved"  (ad was live = someone approved it manually)
 *   Any other unknown value → "held_for_review" (safe default: admin will re-review)
 *
 * Usage:
 *   npm run ts-node src/scripts/migrations/remediate_moderation_status_enum.ts -- --dry-run
 *   npm run ts-node src/scripts/migrations/remediate_moderation_status_enum.ts -- --apply
 */

import mongoose from 'mongoose';
import { env } from '../../config/env';
import logger from '../../utils/logger';

const VALID_MODERATION_STATUSES = new Set([
    'auto_approved',
    'held_for_review',
    'manual_approved',
    'rejected',
    'community_hidden',
]);

const isApply = process.argv.includes('--apply');

async function run() {
    await mongoose.connect(env.MONGODB_URI);
    logger.info(`[remediate_moderation_status_enum] mode=${isApply ? 'APPLY' : 'DRY-RUN'}`);

    const db = mongoose.connection.db!;
    const ads = db.collection('ads');

    // Find all docs whose moderationStatus is set but not in the valid enum
    const cursor = ads.find({
        moderationStatus: { $exists: true, $nin: Array.from(VALID_MODERATION_STATUSES) },
    });

    let scanned = 0;
    let wouldUpdate = 0;
    let updated = 0;
    const breakdown: Record<string, number> = {};

    for await (const doc of cursor) {
        scanned++;
        const stale = doc.moderationStatus as string;
        breakdown[stale] = (breakdown[stale] ?? 0) + 1;

        // Map known legacy values; fall back to 'held_for_review' for anything unknown
        const coerced = stale === 'approved' ? 'manual_approved' : 'held_for_review';
        wouldUpdate++;

        if (isApply) {
            await ads.updateOne(
                { _id: doc._id },
                { $set: { moderationStatus: coerced } }
            );
            updated++;
        }
    }

    logger.info('[remediate_moderation_status_enum] summary', {
        mode: isApply ? 'apply' : 'dry-run',
        scanned,
        wouldUpdate,
        updated,
        breakdown,
    });

    if (!isApply && wouldUpdate > 0) {
        logger.info('[remediate_moderation_status_enum] Re-run with --apply to commit changes');
    }

    await mongoose.disconnect();
}

run().catch((err) => {
    logger.error('[remediate_moderation_status_enum] Fatal error', { error: String(err) });
    process.exit(1);
});
