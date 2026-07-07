require('dotenv').config();
const mongoose = require('mongoose');
const { logger } = require('../../core/dist/utils/logger'); // adjust if needed

async function resetDb() {
    console.log('⚠️ DESTRUCTIVE ACTION: Dropping all database collections in local environment.');
    if (process.env.NODE_ENV === 'production') {
        console.error('⛔ Cannot run reset:dev in production environment.');
        process.exit(1);
    }
    
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/esparex';
        await mongoose.connect(uri);
        const collections = await mongoose.connection.db.collections();
        for (let collection of collections) {
            await collection.drop();
            console.log(`Dropped collection: ${collection.collectionName}`);
        }
        await mongoose.disconnect();
        console.log('✅ Local database reset complete.');
    } catch (error) {
        console.error('Failed to reset database:', error);
        process.exit(1);
    }
}

resetDb();
