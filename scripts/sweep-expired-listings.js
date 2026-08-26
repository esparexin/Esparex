#!/usr/bin/env node

/**
 * Listing Expiry & Cache Invalidation Sweep Script
 * Esparex Monorepo Maintenance Utility
 * 
 * Usage:
 *   node scripts/sweep-expired-listings.js --dry-run
 *   node scripts/sweep-expired-listings.js --apply
 */

const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '../backend/api/.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../apps/web/.env.local') });

const isDryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');
const userMongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/esparex_user';
const adminMongoUri = process.env.ADMIN_MONGODB_URI || 'mongodb://localhost:27017/esparex_admin';
const MS_IN_DAY = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * MS_IN_DAY);

async function sweepDb(mongoUri, label) {
    console.log(`\n--- Inspecting Database: ${label} ---`);
    console.log(`URI: ${mongoUri.replace(/:[^:@]+@/, ':****@')}`);
    let conn;
    try {
        conn = await mongoose.createConnection(mongoUri, { serverSelectionTimeoutMS: 5000 }).asPromise();
        const adsCollection = conn.db.collection('ads');

        const pastThirtyDaysFilter = {
            status: 'live',
            createdAt: { $lt: THIRTY_DAYS_AGO }
        };
        const pastThirtyDaysCount = await adsCollection.countDocuments(pastThirtyDaysFilter);
        console.log(`[1] Live ads created > 30 days ago: ${pastThirtyDaysCount}`);

        const expiredByDateFilter = {
            status: 'live',
            expiresAt: { $lte: new Date() }
        };
        const expiredByDateCount = await adsCollection.countDocuments(expiredByDateFilter);
        console.log(`[2] Live ads with expiresAt <= now: ${expiredByDateCount}`);

        const missingExpiryFilter = {
            status: 'live',
            expiresAt: null
        };
        const missingExpiryCount = await adsCollection.countDocuments(missingExpiryFilter);
        console.log(`[3] Live ads with null/missing expiresAt: ${missingExpiryCount}`);

        if (!isDryRun) {
            const combinedExpireFilter = {
                status: 'live',
                $or: [
                    { createdAt: { $lt: THIRTY_DAYS_AGO } },
                    { expiresAt: { $lte: new Date() } }
                ]
            };

            const expireResult = await adsCollection.updateMany(
                combinedExpireFilter,
                {
                    $set: {
                        status: 'expired',
                        isSpotlight: false,
                        isChatLocked: true,
                        updatedAt: new Date()
                    }
                }
            );
            console.log(`✅ [${label}] Transitioned ${expireResult.modifiedCount} ads to status: 'expired'`);

            const remainingLiveMissingExpiry = {
                status: 'live',
                expiresAt: null
            };
            const populateResult = await adsCollection.updateMany(
                remainingLiveMissingExpiry,
                {
                    $set: {
                        expiresAt: new Date(Date.now() + 30 * MS_IN_DAY),
                        updatedAt: new Date()
                    }
                }
            );
            if (populateResult.modifiedCount > 0) {
                console.log(`✅ [${label}] Populated 30-day expiresAt for ${populateResult.modifiedCount} valid live ads`);
            }
        }
    } catch (error) {
        console.warn(`⚠️ [${label}] Connection/Sweep error: ${error.message}`);
    } finally {
        if (conn) await conn.close();
    }
}

async function clearRedisCaches() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) return;
    try {
        const Redis = require('ioredis');
        const redis = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1, connectTimeout: 4000 });
        await redis.connect();
        const keys = await redis.keys('home_feed:*');
        const feedKeys = await redis.keys('feed:*');
        const allKeys = [...keys, ...feedKeys];
        if (allKeys.length > 0) {
            await redis.del(...allKeys);
            console.log(`🧹 Flushed ${allKeys.length} Redis feed cache keys.`);
        } else {
            console.log('✅ Redis feed cache was clean (0 stale keys).');
        }
        await redis.quit();
    } catch (e) {
        console.warn(`⚠️ Redis cache flush note: ${e.message}`);
    }
}

async function run() {
    console.log('\n======================================================');
    console.log(`  Esparex Listing Expiry Sweep (${isDryRun ? 'DRY RUN' : 'APPLY MODE'})`);
    console.log('======================================================\n');
    console.log(`30-Day Policy Threshold Date: ${THIRTY_DAYS_AGO.toISOString()}`);

    await sweepDb(userMongoUri, 'esparex_user (User Listings)');
    if (adminMongoUri && adminMongoUri !== userMongoUri) {
        await sweepDb(adminMongoUri, 'esparex_admin (Admin Listings)');
    }
    
    if (!isDryRun) {
        await clearRedisCaches();
    }
    console.log('\n======================================================\n');
}

run();
