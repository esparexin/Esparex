/**
 * Listing Type Drift Remediation (idempotent)
 *
 * Problem:
 *   Ad documents may be missing the `listingType` field if they were created
 *   before the unified listing model was enforced, or if the field was somehow
 *   not set during creation.
 *
 *   Valid values: 'ad' | 'service' | 'spare_part'
 *
 * Inference rules (applied in order):
 *   1. If the doc has `onsiteService` or `serviceType` or `priceMin`/`priceMax`
 *      fields → assume 'service'
 *   2. If the doc has `partCondition` or `partNumber` fields → assume 'spare_part'
 *   3. Otherwise → default to 'ad'
 *
 * Usage:
 *   npm run ts-node src/scripts/migrations/remediate_listing_type_drift.ts -- --dry-run
 *   npm run ts-node src/scripts/migrations/remediate_listing_type_drift.ts -- --apply
 */

import mongoose from 'mongoose';
import { env } from '../../config/env';
import logger from '../../utils/logger';

const VALID_LISTING_TYPES = new Set(['ad', 'service', 'spare_part']);

const isApply = process.argv.includes('--apply');

function inferListingType(doc: Record<string, unknown>): string {
    // Service signals
    if (
        doc.onsiteService !== undefined ||
        doc.serviceType !== undefined ||
        doc.priceMin !== undefined ||
        doc.priceMax !== undefined ||
        doc.warranty !== undefined
    ) {
        return 'service';
    }

    // Spare part signals
    if (
        doc.partCondition !== undefined ||
        doc.partNumber !== undefined ||
        doc.compatibleModels !== undefined
    ) {
        return 'spare_part';
    }

    return 'ad';
}

async function run() {
    await mongoose.connect(env.MONGODB_URI);
    logger.info(`[remediate_listing_type_drift] mode=${isApply ? 'APPLY' : 'DRY-RUN'}`);

    const db = mongoose.connection.db!;
    const ads = db.collection('ads');

    // Find all docs whose listingType is missing or invalid
    const cursor = ads.find({
        $or: [
            { listingType: { $exists: false } },
            { listingType: null },
            { listingType: { $nin: Array.from(VALID_LISTING_TYPES) } },
        ],
    });

    let scanned = 0;
    let wouldUpdate = 0;
    let updated = 0;
    const inferred: Record<string, number> = { ad: 0, service: 0, spare_part: 0 };

    for await (const doc of cursor) {
        scanned++;
        const listingType = inferListingType(doc as Record<string, unknown>);
        inferred[listingType] = (inferred[listingType] ?? 0) + 1;
        wouldUpdate++;

        if (isApply) {
            await ads.updateOne(
                { _id: doc._id },
                { $set: { listingType } }
            );
            updated++;
        }
    }

    logger.info('[remediate_listing_type_drift] summary', {
        mode: isApply ? 'apply' : 'dry-run',
        scanned,
        wouldUpdate,
        updated,
        inferred,
    });

    if (!isApply && wouldUpdate > 0) {
        logger.info('[remediate_listing_type_drift] Re-run with --apply to commit changes');
    }

    await mongoose.disconnect();
}

run().catch((err) => {
    logger.error('[remediate_listing_type_drift] Fatal error', { error: String(err) });
    process.exit(1);
});
