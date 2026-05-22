/**
 * Migration: catalog-listing-decoupling
 * -------------------------------------
 * Resolves all data issues before deploying the catalog-listing decoupling changes.
 *
 * Run BEFORE deploying code changes:
 *   npx ts-node -e "require('./scripts/migrate-catalog-decoupling')"
 *   OR in the core package:
 *   npx tsx scripts/migrate-catalog-decoupling.ts
 *
 * What this script does:
 * 1. Clears catalogPending on all ads where catalogPending=true (unblocks held listings).
 * 2. Migrates CatalogRequest: sets requestedByUsers=[requestedBy], requestCount=1 for existing records.
 * 3. Renames status 'duplicate' → 'merged' on existing CatalogRequest records.
 * 4. Verifies zero catalogPending=true ads remain after migration.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL || '';
if (!MONGO_URI) {
    console.error('ERROR: MONGO_URI is not set. Aborting migration.');
    process.exit(1);
}

async function run() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  Catalog–Listing Decoupling Data Migration');
    console.log('═══════════════════════════════════════════════════════════\n');

    await mongoose.connect(MONGO_URI);
    console.log('✅  Connected to MongoDB\n');

    const db = mongoose.connection.db!;
    const ads = db.collection('ads');
    const catalogRequests = db.collection('catalog_requests');

    // ──────────────────────────────────────────────────────────────
    // Step 1: Clear catalogPending on all affected listings
    // ──────────────────────────────────────────────────────────────
    console.log('STEP 1 — Clearing catalogPending=true on all held listings...');
    const heldCount = await ads.countDocuments({ catalogPending: true, isDeleted: { $ne: true } });
    console.log(`  Found ${heldCount} listing(s) with catalogPending=true`);

    if (heldCount > 0) {
        const clearResult = await ads.updateMany(
            { catalogPending: true, isDeleted: { $ne: true } },
            {
                $set: { catalogPending: false },
                $unset: { catalogRequestId: '' },
            }
        );
        console.log(`  ✅  Cleared catalogPending on ${clearResult.modifiedCount} listing(s)`);
    } else {
        console.log('  ✅  No held listings found — nothing to clear');
    }

    // ──────────────────────────────────────────────────────────────
    // Step 2: Populate requestedByUsers and requestCount on existing CatalogRequests
    // ──────────────────────────────────────────────────────────────
    console.log('\nSTEP 2 — Backfilling requestedByUsers and requestCount on existing catalog requests...');
    const withoutSubscribers = await catalogRequests.countDocuments({
        $or: [
            { requestedByUsers: { $exists: false } },
            { requestedByUsers: { $size: 0 } },
        ],
    });
    console.log(`  Found ${withoutSubscribers} record(s) missing requestedByUsers`);

    if (withoutSubscribers > 0) {
        // For all records where requestedByUsers is missing/empty, set [requestedBy]
        const cursor = catalogRequests.find({
            $or: [
                { requestedByUsers: { $exists: false } },
                { requestedByUsers: { $size: 0 } },
            ],
        });

        let backfilled = 0;
        for await (const doc of cursor) {
            await catalogRequests.updateOne(
                { _id: doc._id },
                {
                    $set: {
                        requestedByUsers: doc.requestedBy ? [doc.requestedBy] : [],
                        subscriberUsers: [],
                        requestCount: 1,
                    },
                }
            );
            backfilled++;
        }
        console.log(`  ✅  Backfilled requestedByUsers on ${backfilled} record(s)`);
    } else {
        console.log('  ✅  All records already have requestedByUsers — nothing to backfill');
    }

    // Also set requestCount=1 for any records that have requestedByUsers but no requestCount
    const withoutCount = await catalogRequests.countDocuments({ requestCount: { $exists: false } });
    if (withoutCount > 0) {
        const countResult = await catalogRequests.updateMany(
            { requestCount: { $exists: false } },
            { $set: { requestCount: 1 } }
        );
        console.log(`  ✅  Set requestCount=1 on ${countResult.modifiedCount} additional record(s)`);
    }

    // ──────────────────────────────────────────────────────────────
    // Step 3: Rename status 'duplicate' → 'merged'
    // ──────────────────────────────────────────────────────────────
    console.log('\nSTEP 3 — Renaming CatalogRequest status "duplicate" → "merged"...');
    const duplicateCount = await catalogRequests.countDocuments({ status: 'duplicate' });
    console.log(`  Found ${duplicateCount} record(s) with status="duplicate"`);

    if (duplicateCount > 0) {
        const renameResult = await catalogRequests.updateMany(
            { status: 'duplicate' },
            { $set: { status: 'merged' } }
        );
        console.log(`  ✅  Renamed status on ${renameResult.modifiedCount} record(s)`);
    } else {
        console.log('  ✅  No "duplicate" status records found — nothing to rename');
    }

    // Also rename transitional statuses to 'pending' for any under_review or duplicate_review
    const transitionalCount = await catalogRequests.countDocuments({
        status: { $in: ['under_review', 'duplicate_review'] }
    });
    if (transitionalCount > 0) {
        const transitionalResult = await catalogRequests.updateMany(
            { status: { $in: ['under_review', 'duplicate_review'] } },
            { $set: { status: 'pending' } }
        );
        console.log(`  ✅  Reset ${transitionalResult.modifiedCount} transitional status record(s) to "pending"`);
    }

    // ──────────────────────────────────────────────────────────────
    // Step 4: Verification
    // ──────────────────────────────────────────────────────────────
    console.log('\nSTEP 4 — Verification...');

    const remainingHeld = await ads.countDocuments({ catalogPending: true, isDeleted: { $ne: true } });
    const remainingDuplicate = await catalogRequests.countDocuments({ status: 'duplicate' });
    const remainingTransitional = await catalogRequests.countDocuments({
        status: { $in: ['under_review', 'duplicate_review'] }
    });
    const withoutSubscribersAfter = await catalogRequests.countDocuments({
        $or: [
            { requestedByUsers: { $exists: false } },
            { requestedByUsers: { $size: 0 } },
        ],
    });

    console.log('\n  RESULTS:');
    console.log(`  catalogPending=true ads remaining : ${remainingHeld}         ${remainingHeld === 0 ? '✅' : '❌ FAIL'}`);
    console.log(`  status="duplicate" remaining       : ${remainingDuplicate}         ${remainingDuplicate === 0 ? '✅' : '❌ FAIL'}`);
    console.log(`  Transitional statuses remaining    : ${remainingTransitional}         ${remainingTransitional === 0 ? '✅' : '❌ FAIL'}`);
    console.log(`  Missing requestedByUsers remaining : ${withoutSubscribersAfter}         ${withoutSubscribersAfter === 0 ? '✅' : '❌ FAIL'}`);

    const allPassed =
        remainingHeld === 0 &&
        remainingDuplicate === 0 &&
        remainingTransitional === 0 &&
        withoutSubscribersAfter === 0;

    console.log('\n═══════════════════════════════════════════════════════════');
    if (allPassed) {
        console.log('  Migration completed successfully. ✅  All checks passed.');
    } else {
        console.log('  Migration completed with WARNINGS. Some checks failed — review above.');
    }
    console.log('═══════════════════════════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(allPassed ? 0 : 1);
}

run().catch((err) => {
    console.error('Migration failed with error:', err);
    process.exit(1);
});
