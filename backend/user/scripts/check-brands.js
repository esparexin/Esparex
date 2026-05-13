const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const userUri = process.env.MONGODB_URI;

async function run() {
    console.log(`Connecting to User Database...`);
    const conn = await mongoose.createConnection(userUri, { serverSelectionTimeoutMS: 10000 }).asPromise();
    const db = conn.db;

    // Categories
    const categories = await db.collection('categories').find({}).toArray();
    console.log(`\n=== All Categories in User Database (${categories.length}) ===`);
    categories.forEach(c => {
        console.log(` - Category: ${c.name} (_id: ${c._id}, isActive: ${c.isActive}, isDeleted: ${c.isDeleted}, approvalStatus: ${c.approvalStatus})`);
    });

    // Brands
    const brands = await db.collection('brands').find({}).toArray();
    console.log(`\n=== Brands Summary in User Database ===`);
    console.log(`Total brands: ${brands.length}`);
    const deletedCount = brands.filter(b => b.isDeleted === true).length;
    const activeCount = brands.filter(b => b.isActive === true).length;
    const approvedCount = brands.filter(b => b.approvalStatus === 'approved').length;
    console.log(`Deleted brands: ${deletedCount}`);
    console.log(`Active brands: ${activeCount}`);
    console.log(`Approved brands: ${approvedCount}`);
    
    console.log(`\nNon-deleted brands:`);
    brands.filter(b => !b.isDeleted).forEach(b => {
        console.log(` - Brand: ${b.name} (_id: ${b._id}, isActive: ${b.isActive}, isDeleted: ${b.isDeleted}, approvalStatus: ${b.approvalStatus}, categoryIds: ${JSON.stringify(b.categoryIds)})`);
    });

    await conn.close();
}

run();
