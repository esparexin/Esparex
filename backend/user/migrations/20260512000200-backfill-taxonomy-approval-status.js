'use strict';

const TAXONOMY_COLLECTIONS = [
    'categories',
    'brands',
    'models',
    'spareparts',
    'servicetypes',
    'screensizes',
    'variants',
    'attributes',
];

async function updateIfCollectionExists(db, name, updater) {
    const exists = await db.listCollections({ name }).hasNext();
    if (!exists) return { matchedCount: 0, modifiedCount: 0 };
    return updater(db.collection(name));
}

module.exports = {
    async up(db) {
        for (const collectionName of TAXONOMY_COLLECTIONS) {
            await updateIfCollectionExists(db, collectionName, async (collection) => {
                const rejected = await collection.updateMany(
                    {
                        approvalStatus: { $exists: false },
                        status: 'rejected',
                    },
                    {
                        $set: {
                            approvalStatus: 'rejected',
                            isActive: false,
                        },
                    }
                );

                const approved = await collection.updateMany(
                    {
                        approvalStatus: { $exists: false },
                        isActive: true,
                        isDeleted: { $ne: true },
                        deletedAt: null,
                    },
                    {
                        $set: {
                            approvalStatus: 'approved',
                            status: 'live',
                        },
                    }
                );

                const pending = await collection.updateMany(
                    { approvalStatus: { $exists: false } },
                    {
                        $set: {
                            approvalStatus: 'pending',
                        },
                    }
                );

                const statusLive = await collection.updateMany(
                    { status: { $in: ['active', 'approved', 'published'] } },
                    { $set: { status: 'live' } }
                );

                // eslint-disable-next-line no-console
                console.log(
                    `[migrate] ${collectionName}: rejected=${rejected.modifiedCount}, approved=${approved.modifiedCount}, pending=${pending.modifiedCount}, statusLive=${statusLive.modifiedCount}`
                );
            });
        }
    },

    async down() {
        // no-op: this migration intentionally enforces canonical lifecycle state.
    },
};
