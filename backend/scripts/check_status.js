const mongoose = require('mongoose');
const path = require('path');

// Path to backend's .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const MONGO_URI = process.env.ADMIN_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/esparex_admin';

async function checkStatus() {
    try {
        await mongoose.connect(MONGO_URI);
        const db = mongoose.connection.db;

        console.log('\n--- 🔎 BRAND STATUS CHECK ---');
        const brands = await db.collection('brands').find().limit(5).toArray();
        console.log('Sample Brands Status:');
        brands.forEach(b => {
            console.log(`- ${b.name}: isActive=${b.isActive}, status=${b.status}, needsReview=${b.needsReview}`);
        });

        const activeCount = await db.collection('brands').countDocuments({ isActive: true, status: 'active' });
        const totalCount = await db.collection('brands').countDocuments();
        console.log(`\nBrands: ${activeCount} active / ${totalCount} total`);

        console.log('\n--- 🔎 MODEL STATUS CHECK ---');
        const models = await db.collection('models').find().limit(5).toArray();
        console.log('Sample Models Status:');
        models.forEach(m => {
            console.log(`- ${m.name}: isActive=${m.isActive}, status=${m.status}, brandId=${m.brandId}`);
        });

        const activeModels = await db.collection('models').countDocuments({ isActive: true, status: 'active' });
        const totalModels = await db.collection('models').countDocuments();
        console.log(`\nModels: ${activeModels} active / ${totalModels} total`);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Check failed:', err);
    }
}

checkStatus();
