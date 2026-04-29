'use strict';

/**
 * Normalize status field for categories and brands collections.
 *
 * Root cause: existing documents were created before the status field/default
 * was added to the schema, so they have no status field (or null).
 * The public query requires { status: 'active' }, so these docs were invisible
 * to the user-facing frontend.
 *
 * Fix: any document with isActive=true and a missing/null/unrecognised status
 * gets { status: 'active' }. Any document wih isActive=false and missing status
 * gets { status: 'inactive' }.
 */

/** @param {import('mongodb').Db} db */
async function up(db) {
    const collections = ['categories', 'brands', 'models'];
    const VALID_STATUSES = ['active', 'inactive', 'pending', 'rejected'];

    for (const col of collections) {
        // Active-looking docs with missing/null/legacy status → 'active'
        const activeResult = await db.collection(col).updateMany(
            {
                isDeleted: { $ne: true },
                isActive: true,
                $or: [
                    { status: { $exists: false } },
                    { status: null },
                    { status: { $nin: VALID_STATUSES } },
                ],
            },
            { $set: { status: 'active' } }
        );
        console.log(
            `[up] ${col}: set status='active' on ${activeResult.modifiedCount} docs`
        );

        // Inactive-looking docs with missing/null/legacy status → 'inactive'
        const inactiveResult = await db.collection(col).updateMany(
            {
                $or: [{ isDeleted: true }, { isActive: false }],
                $and: [
                    {
                        $or: [
                            { status: { $exists: false } },
                            { status: null },
                            { status: { $nin: VALID_STATUSES } },
                        ],
                    },
                ],
            },
            { $set: { status: 'inactive' } }
        );
        console.log(
            `[up] ${col}: set status='inactive' on ${inactiveResult.modifiedCount} docs`
        );

        // Ensure isDeleted field exists on every doc (so $ne: true works reliably)
        const deletedResult = await db.collection(col).updateMany(
            { isDeleted: { $exists: false } },
            { $set: { isDeleted: false } }
        );
        console.log(
            `[up] ${col}: ensured isDeleted field on ${deletedResult.modifiedCount} docs`
        );
    }
}

/** @param {import('mongodb').Db} db */
async function down() {
    // We cannot safely undo — we don't know the original missing-field state.
    // This is a data normalisation migration; mark as intentional no-op.
    console.log('[down] normalize-catalog-entity-status: no-op (irreversible normalisation)');
}

module.exports = { up, down };
