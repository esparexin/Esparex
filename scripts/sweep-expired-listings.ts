#!/usr/bin/env npx tsx

/**
 * Listing Expiry & Cache Invalidation Sweep Script
 * Esparex Monorepo Maintenance Utility
 * 
 * Usage:
 *   npx tsx scripts/sweep-expired-listings.ts --dry-run
 *   npx tsx scripts/sweep-expired-listings.ts --apply
 */

import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { LISTING_STATUS } from '@esparex/contracts';

dotenv.config({ path: path.resolve(__dirname, '../backend/api/.env') });
dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env.local') });

const isDryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');
const userMongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/esparex_user';
const adminMongoUri = process.env.ADMIN_MONGODB_URI || 'mongodb://localhost:27017/esparex_admin';
const MS_IN_DAY = 24 * 60 * 60 * 1000;
const EXPIRY_DAYS = 30;
const THIRTY_DAYS_AGO = new Date(Date.now() - EXPIRY_DAYS * MS_IN_DAY);

async function sweepDb(mongoUri: string, label: string): Promise<void> {
    console.log(`\n--- Inspecting Database: ${label} ---`);
    console.log(`URI: ${mongoUri.replace(/:[^:@]+@/, ':****@')}`);
    let conn: mongoose.Connection | undefined;
    try {
        conn = await mongoose.createConnection(mongoUri, { serverSelectionTimeoutMS: 5000 }).asPromise();
        const adsCollection = conn.db?.collection('ads');
        if (!adsCollection) return;

        const pastThirtyDaysFilter = {
            status: LISTING_STATUS.LIVE,
            createdAt: { $lt: THIRTY_DAYS_AGO }
        };
        const pastThirtyDaysCount = await adsCollection.countDocuments(pastThirtyDaysFilter);
        console.log(`[1] Live ads created > 30 days ago: ${pastThirtyDaysCount}`);
        if (pastThirtyDaysCount > 0) {
            const oldAds = await adsCollection.find(pastThirtyDaysFilter, { projection: { title: 1, listingType: 1, createdAt: 1, approvedAt: 1, expiresAt: 1, status: 1 } }).toArray();
            console.log('    Details:', JSON.stringify(oldAds, null, 2));
        }

        const expiredByDateFilter = {
            status: LISTING_STATUS.LIVE,
            expiresAt: { $lte: new Date() }
        };
        const expiredByDateCount = await adsCollection.countDocuments(expiredByDateFilter);
        console.log(`[2] Live ads with expiresAt <= now: ${expiredByDateCount}`);

        const missingExpiryFilter = {
            status: LISTING_STATUS.LIVE,
            expiresAt: null
        };
        const missingExpiryCount = await adsCollection.countDocuments(missingExpiryFilter);
        console.log(`[3] Live ads with null/missing expiresAt: ${missingExpiryCount}`);

        if (!isDryRun) {
            const combinedExpireFilter = {
                status: LISTING_STATUS.LIVE,
                $or: [
                    { createdAt: { $lt: THIRTY_DAYS_AGO } },
                    { expiresAt: { $lte: new Date() } }
                ]
            };

            const expireResult = await adsCollection.updateMany(
                combinedExpireFilter,
                {
                    $set: {
                        status: LISTING_STATUS.EXPIRED,
                        isSpotlight: false,
                        isChatLocked: true,
                        updatedAt: new Date()
                    }
                }
            );
            console.log(`✅ [${label}] Transitioned ${expireResult.modifiedCount} ads to status: '${LISTING_STATUS.EXPIRED}'`);

            const remainingLiveMissingExpiry = {
                status: LISTING_STATUS.LIVE,
                expiresAt: null
            };
            const populateResult = await adsCollection.updateMany(
                remainingLiveMissingExpiry,
                {
                    $set: {
                        expiresAt: new Date(Date.now() + LISTING_LIFECYCLE_CONSTANTS.EXPIRY_DAYS * MS_IN_DAY),
                        updatedAt: new Date()
                    }
                }
            );
            if (populateResult.modifiedCount > 0) {
                console.log(`✅ [${label}] Populated 30-day expiresAt for ${populateResult.modifiedCount} valid live ads`);
            }
        }
    } catch (error) {
        console.warn(`⚠️ [${label}] Connection/Sweep error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        if (conn) await conn.close();
    }
}

async function clearRedisCaches(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) return;
    try {
        const { default: Redis } = await import('ioredis');
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
        console.warn(`⚠️ Redis cache flush note: ${e instanceof Error ? e.message : String(e)}`);
    }
}

async function run(): Promise<void> {
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

void run();
