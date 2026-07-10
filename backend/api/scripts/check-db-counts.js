const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const userUri = process.env.MONGODB_URI;
const adminUri = process.env.ADMIN_MONGODB_URI;

async function checkDb(uri, label) {
    console.log(`Connecting to ${label}...`);
    const conn = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 10000 }).asPromise();
    const db = conn.db;
    const collections = await db.listCollections().toArray();
    console.log(`\n=== Database: ${label} (DB Name: ${db.databaseName}) ===`);
    
    for (const coll of collections) {
        const count = await db.collection(coll.name).countDocuments();
        console.log(` - Collection: ${coll.name}, Document Count: ${count}`);
    }
    await conn.close();
}

async function run() {
    if (!userUri || !adminUri) {
        console.error('Missing MONGODB_URI or ADMIN_MONGODB_URI in environment');
        process.exit(1);
    }
    try {
        await checkDb(userUri, 'User Database');
        await checkDb(adminUri, 'Admin Database');
    } catch (err) {
        console.error('Error checking databases:', err);
    }
}

run();
