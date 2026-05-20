'use strict';

const normalizeCanonicalName = (value) =>
    String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

module.exports = {
    async up(db) {
        const collection = db.collection('catalog_requests');

        let patchedCanonical = 0;
        let patchedNormalized = 0;

        const cursor = collection.find(
            {
                $or: [
                    { canonicalName: { $exists: false } },
                    { canonicalName: null },
                    { canonicalName: '' },
                    { normalizedName: { $exists: false } },
                    { normalizedName: null },
                    { normalizedName: '' },
                ],
            },
            { projection: { requestedName: 1, canonicalName: 1, normalizedName: 1 } }
        );

        while (await cursor.hasNext()) {
            const doc = await cursor.next();
            if (!doc) continue;

            const fallback = normalizeCanonicalName(doc.canonicalName || doc.normalizedName || doc.requestedName);
            if (!fallback) continue;

            const patch = {};
            if (!doc.canonicalName || String(doc.canonicalName).trim().length === 0) {
                patch.canonicalName = fallback;
                patchedCanonical += 1;
            }
            if (!doc.normalizedName || String(doc.normalizedName).trim().length === 0) {
                patch.normalizedName = fallback;
                patchedNormalized += 1;
            }

            if (Object.keys(patch).length > 0) {
                await collection.updateOne({ _id: doc._id }, { $set: patch });
            }
        }

        await collection.createIndex(
            { requestedBy: 1 },
            { name: 'idx_catalog_requests_requestedBy', background: true }
        );

        await collection.createIndex(
            { requestedBy: 1, status: 1, createdAt: -1 },
            { name: 'idx_catalog_requests_requestedBy_status_createdAt', background: true }
        );

        console.log(
            `[catalog-request-ssot] canonicalName patched=${patchedCanonical}, normalizedName patched=${patchedNormalized}`
        );
    },

    async down(db) {
        const collection = db.collection('catalog_requests');

        const existingIndexes = await collection.indexes();
        const indexNames = new Set(existingIndexes.map((index) => index.name));

        if (indexNames.has('idx_catalog_requests_requestedBy')) {
            await collection.dropIndex('idx_catalog_requests_requestedBy');
        }

        if (indexNames.has('idx_catalog_requests_requestedBy_status_createdAt')) {
            await collection.dropIndex('idx_catalog_requests_requestedBy_status_createdAt');
        }
    },
};
