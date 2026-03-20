/**
 * Listing Lifecycle Integrity Sweep (idempotent)
 *
 * Repairs:
 * 1) live listings missing approvedAt
 * 2) expiresAt earlier than approvedAt
 * 3) spotlight enabled on expired listings
 * 4) missing status history entries for live transition
 *
 * Usage:
 *   npm run migrate:lifecycle-integrity-sweep -- --dry-run
 *   npm run migrate:lifecycle-integrity-sweep -- --apply
 */

import mongoose from 'mongoose';
import { env } from '../../config/env';
import logger from '../../utils/logger';
import { AD_STATUS } from '../../../../shared/enums/adStatus';
import { ACTOR_TYPE } from '../../../../shared/enums/actor';

const MS_IN_DAY = 24 * 60 * 60 * 1000;
const EXPIRY_DAYS = 30;

const isApply = process.argv.includes('--apply');

type IntegritySummary = {
    mode: 'dry-run' | 'apply';
    liveMissingApprovedAt: number;
    approvedAtBackfilled: number;
    invalidExpiryChronology: number;
    expiresAtFixed: number;
    spotlightOnExpired: number;
    spotlightDisabled: number;
    liveMissingHistory: number;
    historyInserted: number;
};

async function run() {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('[LifecycleIntegritySweep] Connected to user DB');

    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection failed');

    const ads = db.collection('ads');
    const statusHistory = db.collection('statushistories');

    const summary: IntegritySummary = {
        mode: isApply ? 'apply' : 'dry-run',
        liveMissingApprovedAt: 0,
        approvedAtBackfilled: 0,
        invalidExpiryChronology: 0,
        expiresAtFixed: 0,
        spotlightOnExpired: 0,
        spotlightDisabled: 0,
        liveMissingHistory: 0,
        historyInserted: 0,
    };

    const missingApprovedFilter = {
        status: AD_STATUS.LIVE,
        isDeleted: { $ne: true },
        $or: [{ approvedAt: { $exists: false } }, { approvedAt: null }],
    };

    summary.liveMissingApprovedAt = await ads.countDocuments(missingApprovedFilter);
    if (isApply && summary.liveMissingApprovedAt > 0) {
        const result = await ads.updateMany(
            missingApprovedFilter,
            [{ $set: { approvedAt: { $ifNull: ['$approvedAt', '$createdAt'] } } }]
        );
        summary.approvedAtBackfilled = result.modifiedCount;
    }

    const invalidExpiryDocs = (await ads
        .find(
            {
                approvedAt: { $type: 'date' },
                expiresAt: { $type: 'date' },
                $expr: { $lt: ['$expiresAt', '$approvedAt'] },
            },
            { projection: { _id: 1, approvedAt: 1 } }
        )
        .toArray()) as Array<{ _id: mongoose.Types.ObjectId; approvedAt?: Date }>;

    summary.invalidExpiryChronology = invalidExpiryDocs.length;
    if (isApply && invalidExpiryDocs.length > 0) {
        const bulk = invalidExpiryDocs.flatMap((doc) => {
            const approvedAt = doc.approvedAt instanceof Date ? doc.approvedAt : null;
            if (!approvedAt) return [];

            const expiresAt = new Date(approvedAt.getTime() + EXPIRY_DAYS * MS_IN_DAY);
            return [{
                updateOne: {
                    filter: { _id: doc._id, expiresAt: { $lt: approvedAt } },
                    update: { $set: { expiresAt } },
                },
            }];
        });
        if (bulk.length > 0) {
            const result = await ads.bulkWrite(bulk, { ordered: false });
            summary.expiresAtFixed = result.modifiedCount || 0;
        }
    }

    const spotlightExpiredFilter = {
        status: AD_STATUS.EXPIRED,
        isSpotlight: true,
    };
    summary.spotlightOnExpired = await ads.countDocuments(spotlightExpiredFilter);
    if (isApply && summary.spotlightOnExpired > 0) {
        const result = await ads.updateMany(
            spotlightExpiredFilter,
            { $set: { isSpotlight: false } }
        );
        summary.spotlightDisabled = result.modifiedCount;
    }

    const historyGapDocs = await ads.aggregate<{ _id: mongoose.Types.ObjectId; listingType?: string; approvedAt?: Date; createdAt?: Date }>([
        {
            $match: {
                status: AD_STATUS.LIVE,
                isDeleted: { $ne: true },
            },
        },
        {
            $lookup: {
                from: 'statushistories',
                let: { adId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$domain', 'ad'] },
                                    { $eq: ['$entityId', '$$adId'] },
                                    { $eq: ['$toStatus', AD_STATUS.LIVE] },
                                ],
                            },
                        },
                    },
                    { $limit: 1 },
                ],
                as: 'liveHistory',
            },
        },
        {
            $match: {
                liveHistory: { $size: 0 },
            },
        },
        {
            $project: {
                _id: 1,
                listingType: 1,
                approvedAt: 1,
                createdAt: 1,
            },
        },
    ]).toArray();

    summary.liveMissingHistory = historyGapDocs.length;
    if (isApply && historyGapDocs.length > 0) {
        const now = new Date();
        const docs = historyGapDocs.map((doc) => {
            const ts = doc.approvedAt || doc.createdAt || now;
            return {
                domain: 'ad',
                entityId: doc._id,
                fromStatus: AD_STATUS.PENDING,
                toStatus: AD_STATUS.LIVE,
                actorType: ACTOR_TYPE.SYSTEM,
                actorId: undefined,
                reason: 'Lifecycle integrity backfill: reconstructed missing live transition record',
                metadata: {
                    action: 'integrity_backfill_live_history',
                    sourceRoute: 'migrate_listing_lifecycle_integrity',
                    listingType: doc.listingType || 'ad',
                },
                createdAt: ts,
                updatedAt: ts,
            };
        });
        const result = await statusHistory.insertMany(docs, { ordered: false });
        summary.historyInserted = result.insertedCount;
    }

    logger.info('[LifecycleIntegritySweep] Summary', summary);
    console.log(JSON.stringify(summary, null, 2));

    await mongoose.disconnect();
}

run().catch(async (error) => {
    logger.error('[LifecycleIntegritySweep] Failed', {
        error: error instanceof Error ? error.message : String(error),
    });
    try {
        await mongoose.disconnect();
    } catch {
        // ignore
    }
    process.exit(1);
});
