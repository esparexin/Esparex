'use strict';
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function run() {
    const client = await MongoClient.connect(process.env.ADMIN_MONGODB_URI);
    const db = client.db('esparex_admin');

    const orphanedCatIds = [
        '6986e5e25198ef7741aed1e6',
        '6986ee76e3109120438aa8dd',
        '698741b2820e62e091a7a7d5'
    ].map(id => new ObjectId(id));

    for (const catId of orphanedCatIds) {
        const count = await db.collection('models').countDocuments({ categoryId: catId });
        const models = await db.collection('models').find({ categoryId: catId }, { limit: 5 }).toArray();
        const brandIds = [...new Set(models.map(m => m.brandId))];
        const brands = await db.collection('brands').find({ _id: { $in: brandIds } }).toArray();
        const brandNames = brands.map(b => b.name);
        const modelNames = models.map(m => m.name);
        console.log(`\nOrphaned categoryId: ${catId} (${count} total models)`);
        console.log('  Sample models:', modelNames);
        console.log('  Brands:', brandNames);
    }

    // Also count null categoryId models
    const nullCatCount = await db.collection('models').countDocuments({ $or: [{ categoryId: null }, { categoryId: { $exists: false } }] });
    console.log(`\nModels with null/missing categoryId: ${nullCatCount}`);

    // Current categories
    const cats = await db.collection('categories').find({}, { projection: { name: 1 } }).toArray();
    console.log('\nCurrent admin categories:', cats.map(c => `${c.name}: ${c._id}`));

    await client.close();
}

run().catch(e => { console.error(e.message); process.exit(1); });

