/**
 * Diagnostic script: check actual status/isActive distribution in all catalog collections.
 * Run: node scripts/diagnose-catalog-status.js
 */
'use strict';

require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_ADMIN_URI || process.env.MONGODB_URI;
if (!uri) {
    console.error('ERROR: No MongoDB URI found. Set MONGO_ADMIN_URI or MONGODB_URI in .env');
    process.exit(1);
}

async function run() {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    const collections = ['categories', 'brands', 'models', 'spareparts'];

    for (const col of collections) {
        const total = await db.collection(col).countDocuments({});
        const groups = await db
            .collection(col)
            .aggregate([
                {
                    $group: {
                        _id: {
                            status: '$status',
                            isActive: '$isActive',
                            isDeleted: '$isDeleted',
                        },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { count: -1 } },
            ])
            .toArray();

        console.log(`\n=== ${col.toUpperCase()} (total: ${total}) ===`);
        for (const g of groups) {
            console.log(
                `  status="${g._id.status}"  isActive=${g._id.isActive}  isDeleted=${g._id.isDeleted}  → ${g.count} docs`
            );
        }
    }

    await mongoose.disconnect();
    console.log('\nDone.');
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
