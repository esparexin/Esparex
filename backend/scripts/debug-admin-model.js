'use strict';
require('dotenv').config();
const { MongoClient } = require('mongodb');

MongoClient.connect(process.env.ADMIN_MONGODB_URI).then(async client => {
    const db = client.db('esparex_admin');

    const total = await db.collection('models').countDocuments({});
    const visible = await db.collection('models').countDocuments({ isDeleted: { $ne: true }, isActive: true, status: 'active' });
    console.log('models total:', total, '| visible:', visible);

    const model = await db.collection('models').findOne({ isDeleted: { $ne: true }, isActive: true, status: 'active' });
    console.log('Sample visible model:');
    console.log(JSON.stringify(model, null, 2));

    await client.close();
}).catch(e => { console.error(e.message); process.exit(1); });
