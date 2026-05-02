'use strict';

/**
 * P4 Cleanup: Remove legacy 'approved' value from partial index filters on brands and models.
 *
 * Background:
 *   The unique indexes on `brands` (brand_categoryId_name_unique, brand_categoryId_slug_unique)
 *   were created with `partialFilterExpression: { status: { $in: ['active', 'pending', 'approved'] } }`
 *   to match existing DB documents that had status='approved' (pre-normalisation legacy value).
 *
 *   Migration 20260313140000 has normalised all 'approved' → 'active'.
 *   Migration 20260313180000 confirmed zero 'approved' brand docs remain.
 *
 *   This migration drops those two indexes and recreates them without 'approved'
 *   in the partialFilterExpression, bringing them in line with the CATALOG_STATUS enum.
 *
 * After this migration:
 *   - The CATALOG_BRIDGE mapping ('approved' → 'active') in catalogStatus.ts can be removed.
 *   - The Brand schema partial index expressions can drop 'approved'.
 */

/** @param {import('mongodb').Db} db */
async function up(db) {
    const collections = await db.listCollections({ name: 'brands' }, { nameOnly: true }).toArray();
    if (collections.length === 0) {
        console.log('[up] brands collection does not exist, skipping index cleanup migration');
        return;
    }

    // Safety check: ensure zero 'approved' status docs remain
    const approvedCount = await db.collection('brands').countDocuments({ status: 'approved' });
    if (approvedCount > 0) {
        throw new Error(`Cannot clean indexes: ${approvedCount} brand doc(s) still have status='approved'. Run normalize migration first.`);
    }

    const brandsCol = db.collection('brands');

    // Drop old indexes that include 'approved' in partialFilterExpression
    const existingIndexes = await brandsCol.indexes();
    const toDrop = ['brand_categoryId_name_unique', 'brand_categoryId_slug_unique'];

    for (const idxName of toDrop) {
        const exists = existingIndexes.some(idx => idx.name === idxName);
        if (exists) {
            await brandsCol.dropIndex(idxName);
            console.log(`[up] brands: dropped index ${idxName}`);
        } else {
            console.log(`[up] brands: index ${idxName} not found, skipping drop`);
        }
    }

    // Recreate without 'approved'
    await brandsCol.createIndex(
        { categoryId: 1, name: 1 },
        {
            name: 'brand_categoryId_name_unique',
            unique: true,
            collation: { locale: 'en', strength: 2 },
            partialFilterExpression: {
                isDeleted: false,
                status: { $in: ['active', 'pending'] }
            }
        }
    );
    console.log('[up] brands: recreated brand_categoryId_name_unique without approved');

    await brandsCol.createIndex(
        { categoryId: 1, slug: 1 },
        {
            name: 'brand_categoryId_slug_unique',
            unique: true,
            partialFilterExpression: {
                isDeleted: false,
                status: { $in: ['active', 'pending'] }
            }
        }
    );
    console.log('[up] brands: recreated brand_categoryId_slug_unique without approved');
}

/** @param {import('mongodb').Db} db */
async function down(db) {
    const collections = await db.listCollections({ name: 'brands' }, { nameOnly: true }).toArray();
    if (collections.length === 0) {
        console.log('[down] brands collection does not exist, skipping rollback');
        return;
    }

    // Restore indexes with 'approved' in their partial filter
    const brandsCol = db.collection('brands');

    const toDrop = ['brand_categoryId_name_unique', 'brand_categoryId_slug_unique'];
    for (const idxName of toDrop) {
        const existingIndexes = await brandsCol.indexes();
        if (existingIndexes.some(idx => idx.name === idxName)) {
            await brandsCol.dropIndex(idxName);
        }
    }

    await brandsCol.createIndex(
        { categoryId: 1, name: 1 },
        {
            name: 'brand_categoryId_name_unique',
            unique: true,
            collation: { locale: 'en', strength: 2 },
            partialFilterExpression: {
                isDeleted: false,
                status: { $in: ['active', 'pending', 'approved'] }
            }
        }
    );

    await brandsCol.createIndex(
        { categoryId: 1, slug: 1 },
        {
            name: 'brand_categoryId_slug_unique',
            unique: true,
            partialFilterExpression: {
                isDeleted: false,
                status: { $in: ['active', 'pending', 'approved'] }
            }
        }
    );
    console.log('[down] brands: restored indexes with approved in partial filter');
}

module.exports = { up, down };
