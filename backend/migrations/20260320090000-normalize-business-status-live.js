/**
 * Migration: normalize-business-status-live
 *
 * Converts legacy business lifecycle aliases to canonical published state.
 * Legacy aliases: "active", "approved"
 * Canonical value: "live"
 *
 * Safe to re-run: updateMany is idempotent.
 */

'use strict';

const LEGACY_VALUES = ['active', 'approved'];
const CANONICAL_VALUE = 'live';

module.exports = {
    async up(db) {
        const result = await db.collection('businesses').updateMany(
            { status: { $in: LEGACY_VALUES } },
            { $set: { status: CANONICAL_VALUE } }
        );

        console.log(
            `[migrate] normalize-business-status-live: converted ${result.modifiedCount} ` +
            `documents (${LEGACY_VALUES.join(', ')} -> ${CANONICAL_VALUE})`
        );
    },

    async down(_db) {
        console.warn(
            '[migrate] normalize-business-status-live DOWN: not reversible without original status snapshots. No changes made.'
        );
    },
};

