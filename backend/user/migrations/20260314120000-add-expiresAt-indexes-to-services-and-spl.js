'use strict';

/**
 * FIX-5: Add expiresAt+status compound sparse indexes to `services` and `spare_part_listings`.
 *
 * Background:
 *   The daily expiry cron (businessContentService.expireOutdatedContent) queries:
 *     { status: LIVE, expiresAt: { $lt: now } }
 *   on both collections. Without indexes, this is a full collection scan on every daily run.
 *
 *   The Ad model already has an expiresAt index. This migration brings Services and SPL up to parity.
 *
 * Indexes created:
 *   services.service_expiresAt_status_idx  { expiresAt: 1, status: 1 }  sparse: true
 *   spare_part_listings.spl_expiresAt_status_idx  { expiresAt: 1, status: 1 }  sparse: true
 */

'use strict';

/** @param {import('mongodb').Db} db */
async function up(db) {
    await db.collection('services').createIndex(
        { expiresAt: 1, status: 1 },
        { name: 'service_expiresAt_status_idx', sparse: true, background: true }
    );

    await db.collection('spare_part_listings').createIndex(
        { expiresAt: 1, status: 1 },
        { name: 'spl_expiresAt_status_idx', sparse: true, background: true }
    );
}

/** @param {import('mongodb').Db} db */
async function down(db) {
    await db.collection('services').dropIndex('service_expiresAt_status_idx').catch(() => {});
    await db.collection('spare_part_listings').dropIndex('spl_expiresAt_status_idx').catch(() => {});
}

module.exports = { up, down };
