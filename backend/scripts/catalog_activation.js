const mongoose = require('mongoose');
const path = require('path');

// Path to backend's .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const MONGO_URI = process.env.ADMIN_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/esparex_admin';

async function runActivation() {
    try {
        console.log('Connecting to:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;

        console.log('\n--- 🚀 ACTIVATING BRANDS ---');
        const brandResult = await db.collection('brands').updateMany(
            { status: 'active', isActive: false },
            { $set: { isActive: true } }
        );
        console.log(`Activated ${brandResult.modifiedCount} brands.`);

        console.log('\n--- 🚀 ACTIVATING MODELS ---');
        const modelResult = await db.collection('models').updateMany(
            { status: 'active', isActive: false },
            { $set: { isActive: true } }
        );
        console.log(`Activated ${modelResult.modifiedCount} models.`);

        console.log('\n✅ Catalog Activation Complete!');
        await mongoose.disconnect();
    } catch (err) {
        console.error('Activation failed:', err);
        process.exit(1);
    }
}

runActivation();
