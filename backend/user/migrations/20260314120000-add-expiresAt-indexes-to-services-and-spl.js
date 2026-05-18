'use strict';

/**
 * FIX-5: Add expiresAt+status compound sparse indexes to `services` and `spare_part_listings`.
 *
 * Idempotency note:
 *   Some environments already contain equivalent indexes under legacy names
 *   (for example: `idx_service_expiresAt_status`). In those cases we should
 *   treat the index as satisfied and skip index creation rather than failing
 *   with IndexOptionsConflict.
 */

function keysEqual(a = {}, b = {}) {
    const aEntries = Object.entries(a);
    const bEntries = Object.entries(b);
    if (aEntries.length !== bEntries.length) return false;
    return aEntries.every(([key, value]) => b[key] === value);
}

async function ensureIndex(collection, key, options) {
    const exists = await collection.db
        .listCollections({ name: collection.collectionName })
        .hasNext();
    if (!exists) {
        console.log(`[migrate] ${collection.collectionName}: collection missing, skipping ${options.name}`);
        return;
    }

    const indexes = await collection.indexes();
    const existing = indexes.find((index) => index.name === options.name);
    if (existing) return;

    const equivalent = indexes.find((index) => keysEqual(index.key, key));
    if (equivalent) {
        console.log(
            `[migrate] ${collection.collectionName}: equivalent index already exists (${equivalent.name}), skipping ${options.name}`
        );
        return;
    }

    await collection.createIndex(key, options);
}

/** @param {import('mongodb').Db} db */
async function up(db) {
    await ensureIndex(
        db.collection('services'),
        { expiresAt: 1, status: 1 },
        { name: 'service_expiresAt_status_idx', sparse: true, background: true }
    );

    await ensureIndex(
        db.collection('spare_part_listings'),
        { expiresAt: 1, status: 1 },
        { name: 'spl_expiresAt_status_idx', sparse: true, background: true }
    );
}

/** @param {import('mongodb').Db} db */
async function down(db) {
    await db.collection('services').dropIndex('service_expiresAt_status_idx').catch(() => {});
    await db.collection('services').dropIndex('idx_service_expiresAt_status').catch(() => {});
    await db.collection('spare_part_listings').dropIndex('spl_expiresAt_status_idx').catch(() => {});
    await db.collection('spare_part_listings').dropIndex('idx_spl_expiresAt_status').catch(() => {});
}

module.exports = { up, down };
