'use strict';

/**
 * Remap orphaned categoryId references in the models collection.
 *
 * Background: the admin DB was populated with models that referenced old/deleted
 * category IDs. The queries use categoryId to filter models, so models with
 * orphaned categoryId references are invisible in the API.
 *
 * Mapping (determined from model/brand names):
 *  - 6986e5e25198ef7741aed1e6 (old Smartphones/Phones) → 698741b2820e62e091a7a7d4 (Mobiles)
 *  - 6986ee76e3109120438aa8dd (test model category)    → 698741b2820e62e091a7a7d4 (Mobiles)
 *  - 698741b2820e62e091a7a7d5 (test model category 2)  → 698741b2820e62e091a7a7d4 (Mobiles)
 */

const { ObjectId } = require('mongodb');

const MOBILES_ID = new ObjectId('698741b2820e62e091a7a7d4');

const ORPHANED_TO_MOBILES = [
    new ObjectId('6986e5e25198ef7741aed1e6'),
    new ObjectId('6986ee76e3109120438aa8dd'),
    new ObjectId('698741b2820e62e091a7a7d5'),
];

/** @param {import('mongodb').Db} db */
async function up(db) {
    // Remap orphaned category references
    const remapResult = await db.collection('models').updateMany(
        { categoryId: { $in: ORPHANED_TO_MOBILES } },
        { $set: { categoryId: MOBILES_ID, migrationRemappedCategory: true } }
    );
    console.log(`[up] models: remapped ${remapResult.modifiedCount} orphaned categoryId → Mobiles`);

    // Also update brand categoryId for Apple (iPhones) brand to include Mobiles
    // The Apple iPhone brand's categoryId may reference the old category too
    const brandRemapResult = await db.collection('brands').updateMany(
        { categoryId: { $in: ORPHANED_TO_MOBILES } },
        { $set: { categoryId: MOBILES_ID, migrationRemappedCategory: true } }
    );
    console.log(`[up] brands: remapped ${brandRemapResult.modifiedCount} orphaned categoryId → Mobiles`);
}

/** @param {import('mongodb').Db} db */
async function down(_db) {
    console.log('[down] remap-orphaned-category-refs: no-op (IDs no longer exist, cannot reverse)');
}

module.exports = { up, down };
