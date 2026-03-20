'use strict';

/**
 * Restore accidentally soft-deleted catalog records.
 *
 * Root cause: A bulk operation (script / prior migration) set isDeleted=true
 * on all brands and models, making them invisible to both admin and public views.
 * Categories were not affected.
 *
 * Fix: restore records that have isDeleted=true but clearly belong to active/
 * visible master data (status='active', isActive=true). Pending/inactive records
 * that were explicitly soft-deleted are left as-is.
 *
 * Also: spare parts that are not deleted but have isActive=false while
 * status='active' are in an inconsistent state — normalise by setting
 * isActive=true so they appear in public queries.
 */

/** @param {import('mongodb').Db} db */
async function up(db) {
    // --- BRANDS: restore active brands that were accidentally soft-deleted ---
    const brandRestore = await db.collection('brands').updateMany(
        { isDeleted: true, isActive: true, status: 'active' },
        {
            $set: {
                isDeleted: false,
                restoredAt: new Date(),
                restoredReason: 'restore-accidentally-soft-deleted-active-records',
            },
        }
    );
    console.log(`[up] brands: restored ${brandRestore.modifiedCount} active docs (isDeleted false→true was wrong)`);

    // --- MODELS: restore active models that were accidentally soft-deleted ---
    const modelRestore = await db.collection('models').updateMany(
        { isDeleted: true, isActive: true, status: 'active' },
        {
            $set: {
                isDeleted: false,
                restoredAt: new Date(),
                restoredReason: 'restore-accidentally-soft-deleted-active-records',
            },
        }
    );
    console.log(`[up] models: restored ${modelRestore.modifiedCount} active docs`);

    // --- SPARE PARTS: fix isActive=false when status='active' (not deleted) ---
    const sparePartFix = await db.collection('spareparts').updateMany(
        { isDeleted: { $ne: true }, status: 'active', isActive: false },
        { $set: { isActive: true } }
    );
    console.log(`[up] spareparts: corrected isActive for ${sparePartFix.modifiedCount} active-status docs`);
}

/** @param {import('mongodb').Db} db */
async function down(db) {
    // Re-soft-delete the records we restored (using the restoredReason marker)
    const brandUndo = await db.collection('brands').updateMany(
        { restoredReason: 'restore-accidentally-soft-deleted-active-records' },
        { $set: { isDeleted: true }, $unset: { restoredAt: '', restoredReason: '' } }
    );
    console.log(`[down] brands: re-soft-deleted ${brandUndo.modifiedCount} docs`);

    const modelUndo = await db.collection('models').updateMany(
        { restoredReason: 'restore-accidentally-soft-deleted-active-records' },
        { $set: { isDeleted: true }, $unset: { restoredAt: '', restoredReason: '' } }
    );
    console.log(`[down] models: re-soft-deleted ${modelUndo.modifiedCount} docs`);
}

module.exports = { up, down };
