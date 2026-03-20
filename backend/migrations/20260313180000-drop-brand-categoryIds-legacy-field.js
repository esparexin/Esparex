'use strict';

/**
 * P3 Cleanup: Remove the legacy `categoryIds` array field from all brand documents.
 *
 * Pre-condition (verified by scripts/check-legacy-fields.js):
 *   - All brands have `categoryId` set (backfill migration 20260313160000 ran clean).
 *   - No brand has a non-empty `categoryIds` array remaining.
 *
 * After this migration:
 *   - Brand.categoryIds field can be removed from the Mongoose schema.
 *   - The $or query in catalogBrandModelController can be simplified to use only categoryId.
 */

/** @param {import('mongodb').Db} db */
async function up(db) {
    // Safety check: abort if any brand still lacks categoryId
    const missing = await db.collection('brands').countDocuments({
        $or: [{ categoryId: { $exists: false } }, { categoryId: null }]
    });
    if (missing > 0) {
        throw new Error(`Cannot drop categoryIds: ${missing} brand(s) still have no categoryId. Run backfill migration first.`);
    }

    const result = await db.collection('brands').updateMany(
        { categoryIds: { $exists: true } },
        { $unset: { categoryIds: '' } }
    );
    console.log(`[up] brands: removed legacy categoryIds field from ${result.modifiedCount} documents`);
}

/** @param {import('mongodb').Db} db */
async function down(db) {
    // Cannot restore the array; this is intentional data-shape cleanup.
    console.log('[down] drop-brand-categoryIds: no-op — field removal is irreversible');
}

module.exports = { up, down };
