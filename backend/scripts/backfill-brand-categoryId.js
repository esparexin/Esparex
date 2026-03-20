'use strict';
require('dotenv').config();
const { MongoClient } = require('mongodb');
const uri = process.env.ADMIN_MONGODB_URI;

MongoClient.connect(uri).then(async client => {
    const db = client.db('esparex_admin');

    // Check brands with categoryIds but no categoryId
    const missing = await db.collection('brands').countDocuments({
        categoryIds: { $exists: true, $type: 'array' },
        $or: [{ categoryId: { $exists: false } }, { categoryId: null }]
    });
    console.log('Brands missing categoryId but having categoryIds:', missing);

    const sample = await db.collection('brands').findOne({ categoryIds: { $exists: true } });
    if (sample) {
        console.log('Sample brand keys:', Object.keys(sample));
        console.log('categoryId:', sample.categoryId);
        console.log('categoryIds:', JSON.stringify(sample.categoryIds));
    }

    // Direct fix: run the aggregation pipeline update
    const result = await db.collection('brands').updateMany(
        {
            categoryIds: { $exists: true, $ne: [], $type: 'array' },
            $or: [
                { categoryId: { $exists: false } },
                { categoryId: null },
            ],
        },
        [
            { $set: { categoryId: { $arrayElemAt: ['$categoryIds', 0] } } }
        ]
    );
    console.log('Updated brands:', result.modifiedCount);

    await client.close();
}).catch(e => { console.error(e.message); process.exit(1); });
