/**
 * Migration: normalize-sparepart-status
 *
 * Converts legacy status values ('live', 'approved') stored in the
 * `spareparts` collection to the canonical value 'active'.
 *
 * Background:
 *   - Early code set status: 'live' on approval (copied from Ad logic)
 *   - Some repair scripts set status: 'approved' on activation
 *   - The canonical CATALOG_STATUS enum uses 'active' exclusively
 *   - Without this migration, existing spare parts remain invisible to every
 *     public catalog query that filters { status: 'active' }
 *
 * Safe to re-run: updateMany is idempotent — documents already 'active'
 * are not touched.
 */

'use strict';

const LEGACY_VALUES = ['live', 'approved'];
const CANONICAL_VALUE = 'active';

module.exports = {
    async up(db) {
        const result = await db.collection('spareparts').updateMany(
            { status: { $in: LEGACY_VALUES } },
            { $set: { status: CANONICAL_VALUE } }
        );
        console.log(
            `[migrate] normalize-sparepart-status: converted ${result.modifiedCount} ` +
            `documents (${LEGACY_VALUES.join(', ')} → ${CANONICAL_VALUE})`
        );
    },

    async down() {
        // Intentionally a no-op: we cannot know which documents were originally
        // 'live' vs 'approved', so reversing the migration would be lossy.
        console.warn(
            '[migrate] normalize-sparepart-status DOWN: not reversible — ' +
            'original legacy values cannot be recovered. No changes made.'
        );
    },
};
