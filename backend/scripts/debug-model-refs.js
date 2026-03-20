'use strict';
require('dotenv').config();
const { MongoClient } = require('mongodb');

MongoClient.connect(process.env.ADMIN_MONGODB_URI).then(async client => {
    const db = client.db('esparex_admin');

    // Get current category IDs
    const categories = await db.collection('categories').find({}).toArray();
    console.log('Admin categories:');
    categories.forEach(c => console.log(` - ${c.name}: ${c._id}`));

    const catIds = categories.map(c => String(c._id));

    // How many models reference one of these category IDs?
    const matching = await db.collection('models').countDocuments({ categoryId: { $in: catIds } });
    const total = await db.collection('models').countDocuments({ isDeleted: { $ne: true }, isActive: true, status: 'active' });
    console.log(`\nVisible models: ${total} | models referencing valid admin categories: ${matching}`);

    // Show distinct categoryIds in models
    const distinctCats = await db.collection('models').distinct('categoryId', { isDeleted: { $ne: true }, isActive: true, status: 'active' });
    console.log('Distinct categoryIds used by visible models:', distinctCats);

    // Show distinct brandIds in models
    const distinctBrands = await db.collection('models').distinct('brandId', { isDeleted: { $ne: true }, isActive: true, status: 'active' });
    console.log('\nSample model brandIds:', distinctBrands.slice(0, 3));

    // Do those brand IDs exist in brands collection?
    const brandIds = distinctBrands.map(String);
    const matchingBrands = await db.collection('brands').countDocuments({ _id: { $in: brandIds } });
    const brandSample = await db.collection('brands').findOne({ _id: brandIds[0] });
    console.log(`Models reference ${brandIds.length} distinct brands | found in brands collection: ${matchingBrands}`);
    console.log('Sample brand by ID:', brandSample ? brandSample.name : 'NOT FOUND');

    await client.close();
}).catch(e => { console.error(e.message); process.exit(1); });
