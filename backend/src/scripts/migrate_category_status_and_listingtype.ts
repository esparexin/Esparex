/**
 * Category Data Repair Script
 * ────────────────────────────
 * Fixes two known issues that cause categories to be invisible to the user frontend:
 *
 * 1. Status mismatch: legacy categories with `status: 'active'` are not returned
 *    by the public API, which requires `status: 'live'`.
 *
 * 2. Missing listingType: categories with an empty `listingType` array are silently
 *    filtered out by frontend hooks. Type='AD' categories default to ['postad'].
 *
 * Safe to run multiple times (idempotent).
 *
 * Usage:
 *   cd /Users/admin/Desktop/EsparexAdmin
 *   npx ts-node -r tsconfig-paths/register backend/src/scripts/migrate_category_status_and_listingtype.ts
 */

import '../config/loadEnv';
import { getAdminConnection } from '../config/db';
import Category from '../models/Category';

async function repairCategories(): Promise<void> {
    console.log('════════════════════════════════════════');
    console.log('  ESPAREX — Category Data Repair Script  ');
    console.log('════════════════════════════════════════');

    const adminConn = await getAdminConnection();
    if (adminConn.readyState !== 1) {
        await new Promise<void>((resolve) => adminConn.once('connected', resolve));
    }
    console.log('✅ Connected to database.\n');

    // ─── Fix 1: Status Mismatch ───────────────────────────────────────────────
    // The ACTIVE_CATEGORY_QUERY requires status:'live' but legacy data has status:'active'
    const statusResult = await Category.updateMany(
        {
            status: 'active' as any,
            isDeleted: { $ne: true },
        },
        {
            $set: { status: 'live' },
        }
    );
    console.log(`[Fix 1] Status repair:  ${statusResult.modifiedCount} categories updated  (active → live)`);

    // ─── Fix 2: Missing listingType on AD categories ──────────────────────────
    // Frontend hooks filter by listingType. Empty arrays → silent empty UI.
    // Default: type=AD categories should support 'postad'.
    const listingTypeResult = await Category.updateMany(
        {
            type: 'AD',
            isDeleted: { $ne: true },
            $or: [
                { listingType: { $exists: false } },
                { listingType: { $size: 0 } },
            ],
        },
        {
            $set: { listingType: ['postad'] },
        }
    );
    console.log(`[Fix 2] listingType repair:  ${listingTypeResult.modifiedCount} AD categories backfilled  ([] → ['postad'])`);

    // ─── Report ───────────────────────────────────────────────────────────────
    const total = await Category.countDocuments({ isDeleted: { $ne: true } });
    const live  = await Category.countDocuments({ isDeleted: { $ne: true }, status: 'live', isActive: true });
    const withListingType = await Category.countDocuments({
        isDeleted: { $ne: true },
        listingType: { $exists: true, $not: { $size: 0 } },
    });

    console.log('\n── Post-repair summary ──────────────────');
    console.log(`  Total non-deleted categories : ${total}`);
    console.log(`  Active + live (publicly visible) : ${live}`);
    console.log(`  Categories with listingType set  : ${withListingType}`);
    console.log('─────────────────────────────────────────');
    console.log('✅ Repair complete.\n');

    process.exit(0);
}

repairCategories().catch((err) => {
    console.error('❌ Repair script failed:', err);
    process.exit(1);
});
