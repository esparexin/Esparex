'use strict';
require('dotenv').config();
const { MongoClient } = require('mongodb');

MongoClient.connect(process.env.ADMIN_MONGODB_URI).then(async client => {
    const db = client.db('esparex_admin');

    // Print one brand
    const brand = await db.collection('brands').findOne({});
    console.log('RAW admin brand:');
    console.log(JSON.stringify(brand, null, 2));

    // Print one category
    const cat = await db.collection('categories').findOne({});
    console.log('RAW admin category:');
    console.log(JSON.stringify(cat, null, 2));

    // Check how many brands have categoryId set (and what type)
    const withCatId = await db.collection('brands').countDocuments({ categoryId: { $exists: true, $ne: null } });
    const withCatIds = await db.collection('brands').countDocuments({ categoryIds: { $exists: true } });
    const total = await db.collection('brands').countDocuments({});
    console.log(`brands total: ${total} | have categoryId: ${withCatId} | have categoryIds: ${withCatIds}`);

    await client.close();
}).catch(e => { console.error(e.message); process.exit(1); });
