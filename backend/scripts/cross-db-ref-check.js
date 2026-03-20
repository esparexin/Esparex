'use strict';
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function run() {
    const adminClient = await MongoClient.connect(process.env.ADMIN_MONGODB_URI);
    const adminDb = adminClient.db('esparex_admin');

    const userClient = await MongoClient.connect(process.env.MONGODB_URI);
    const userDb = userClient.db('esparex_user');

    // Get the category IDs referenced by models in admin DB
    const modelCatIds = await adminDb.collection('models').distinct('categoryId', {});
    const modelBrandIds = await adminDb.collection('models').distinct('brandId', {});
    console.log('Category IDs referenced by admin models:', modelCatIds.map(String));
    console.log('Brand IDs referenced by admin models (first 5):', modelBrandIds.slice(0, 5).map(String));

    // Check if those IDs exist in esparex_user categories/brands
    for (const catId of modelCatIds) {
        const adminCat = await adminDb.collection('categories').findOne({ _id: catId });
        const userCat = await userDb.collection('categories').findOne({ _id: catId });
        console.log(`\nCat ${catId}:`);
        console.log('  In admin DB:', adminCat ? adminCat.name : 'NOT FOUND');
        console.log('  In user DB:', userCat ? userCat.name : 'NOT FOUND');
    }

    // Check a sample brand
    const sampleBrandId = modelBrandIds[0];
    const adminBrand = await adminDb.collection('brands').findOne({ _id: sampleBrandId });
    const userBrand = await userDb.collection('brands').findOne({ _id: sampleBrandId });
    console.log(`\nSample brandId ${sampleBrandId}:`);
    console.log('  In admin DB:', adminBrand ? adminBrand.name : 'NOT FOUND');
    console.log('  In user DB:', userBrand ? userBrand.name : 'NOT FOUND');

    await adminClient.close();
    await userClient.close();
}

run().catch(e => { console.error(e.message); process.exit(1); });
