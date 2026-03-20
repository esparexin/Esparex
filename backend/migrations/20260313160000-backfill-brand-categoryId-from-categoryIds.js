'use strict';

/**
 * Backfill `categoryId` on brand documents that only have the legacy
 * `categoryIds` array (from seed data). Sets `categoryId = categoryIds[0]`.
 *
 * This lets the Brand schema's `categoryId` field (which the controller uses
 * for filtering and validation) work correctly for all brands regardless of
 * whether they were seeded or created via the admin form.
 */

/** @param {import('mongodb').Db} db */
async function up(db) {
    const result = await db.collection('brands').updateMany(
        {
            // Has categoryIds array with at least one entry
            categoryIds: { $exists: true, $ne: [], $type: 'array' },
            // But categoryId is missing or null
            $or: [
                { categoryId: { $exists: false } },
                { categoryId: null },
            ],
        },
        [
            // Aggregation pipeline update: set categoryId = first element of categoryIds
            { $set: { categoryId: { $arrayElemAt: ['$categoryIds', 0] } } }
        ]
    );
    console.log(`[up] brands: backfilled categoryId from categoryIds[0] on ${result.modifiedCount} docs`);
}

/** @param {import('mongodb').Db} db */
async function down(_db) {
    console.log('[down] backfill-brand-categoryId: no-op (cannot safely un-set categoryId)');
}

module.exports = { up, down };
