'use strict';

const REQUIRED_COLLECTIONS = ['variants', 'attributes', 'taxonomyAliases', 'taxonomySynonyms'];

async function ensureCollection(db, name) {
    const exists = await db.listCollections({ name }).hasNext();
    if (!exists) {
        await db.createCollection(name);
        // eslint-disable-next-line no-console
        console.log(`[migrate] created collection: ${name}`);
    }
}

function keysEqual(a = {}, b = {}) {
    const aEntries = Object.entries(a);
    const bEntries = Object.entries(b);
    if (aEntries.length !== bEntries.length) return false;
    return aEntries.every(([key, value]) => b[key] === value);
}

async function ensureIndex(collection, key, options) {
    const indexes = await collection.indexes();
    const named = indexes.some((index) => index.name === options.name);
    if (named) {
        // eslint-disable-next-line no-console
        console.log(`[migrate] index exists, skipping: ${options.name}`);
        return;
    }

    const equivalent = indexes.find((index) => keysEqual(index.key, key));
    if (equivalent) {
        // eslint-disable-next-line no-console
        console.log(`[migrate] equivalent index exists (${equivalent.name}), skipping: ${options.name}`);
        return;
    }

    await collection.createIndex(key, options);
    // eslint-disable-next-line no-console
    console.log(`[migrate] created index: ${options.name}`);
}

module.exports = {
    async up(db) {
        for (const name of REQUIRED_COLLECTIONS) {
            await ensureCollection(db, name);
        }

        await ensureIndex(
            db.collection('brands'),
            { categoryIds: 1, slug: 1 },
            {
                name: 'idx_brand_categoryIds_slug_unique',
                unique: true,
                partialFilterExpression: {
                    isDeleted: false,
                    slug: { $type: 'string' },
                },
            }
        );

        await ensureIndex(
            db.collection('models'),
            { brandId: 1, slug: 1 },
            {
                name: 'idx_model_brand_slug_unique',
                unique: true,
                partialFilterExpression: {
                    isDeleted: false,
                    slug: { $type: 'string' },
                    brandId: { $exists: true },
                },
            }
        );

        await ensureIndex(
            db.collection('variants'),
            { modelId: 1, slug: 1 },
            {
                name: 'idx_variant_model_slug_unique',
                unique: true,
                partialFilterExpression: {
                    isDeleted: false,
                    slug: { $type: 'string' },
                    modelId: { $exists: true },
                },
            }
        );
    },

    async down(db) {
        await db.collection('brands').dropIndex('idx_brand_categoryIds_slug_unique').catch(() => undefined);
        await db.collection('models').dropIndex('idx_model_brand_slug_unique').catch(() => undefined);
        await db.collection('variants').dropIndex('idx_variant_model_slug_unique').catch(() => undefined);
    },
};
