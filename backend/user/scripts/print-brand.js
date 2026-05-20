const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const userUri = process.env.MONGODB_URI;

async function run() {
    console.log(`Connecting to User Database...`);
    const conn = await mongoose.createConnection(userUri, { serverSelectionTimeoutMS: 10000 }).asPromise();
    const db = conn.db;

    const brands = await db.collection('brands').find({ isDeleted: { $ne: true } }).toArray();
    console.log(`\n=== Brands in User Database ===`);
    brands.forEach(b => {
        console.log(JSON.stringify(b, null, 2));
    });

    await conn.close();
}

run();
