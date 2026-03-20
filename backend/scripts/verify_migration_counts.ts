import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.ADMIN_MONGODB_URI || process.env.MONGO_URI;

async function checkCounts() {
    if (!MONGO_URI) {
        console.error('MONGO_URI not found');
        process.exit(1);
    }
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    if (!db) {
        console.error('Database connection failed');
        process.exit(1);
    }

    const collections = ['ads', 'services', 'businessparts'];
    for (const col of collections) {
        const count = await db.collection(col).countDocuments({ status: 'active' });
        console.log(`${col}: ${count}`);
    }
    await mongoose.disconnect();
}

checkCounts();
