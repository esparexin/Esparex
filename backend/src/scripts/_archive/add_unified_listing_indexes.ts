/**
 * Phase 1 — Unified Listing Engine Index Migration
 *
 * Adds two missing compound indexes to the `ads` collection.
 * Run once against existing deployments (uses `background: true` to avoid locking).
 *
 * Usage:
 *   npx ts-node --project tsconfig.json src/scripts/migrations/add_unified_listing_indexes.ts
 */

import mongoose from 'mongoose';
import { env } from '../../config/env';
import logger from '../../utils/logger';

async function run() {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('[IndexMigration] Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
        throw new Error('Database connection failed - mongoose.connection.db is undefined');
    }
    const col = db.collection('ads');

    // 1. listingType + status + createdAt
    //    Covers: per-type feed tabs, admin moderation queue, type-aware cron expiry
    await col.createIndex(
        { listingType: 1, status: 1, createdAt: -1 },
        { name: 'idx_ad_listingType_status_createdAt', background: true }
    );
    logger.info('[IndexMigration] Created idx_ad_listingType_status_createdAt');

    // 2. brandId + categoryId + status
    //    Covers: brand+category search filter used by browse and related discovery
    await col.createIndex(
        { brandId: 1, categoryId: 1, status: 1 },
        { name: 'idx_ad_brand_category_status', background: true }
    );
    logger.info('[IndexMigration] Created idx_ad_brand_category_status');

    logger.info('[IndexMigration] ✅ All Phase 1 indexes created successfully');
    await mongoose.disconnect();
}

run().catch((err) => {
    logger.error('[IndexMigration] ❌ Failed', err);
    process.exit(1);
});
