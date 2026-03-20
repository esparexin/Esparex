import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function debug() {
    const uri = process.env.ADMIN_MONGODB_URI;
    if (!uri) throw new Error("ADMIN_MONGODB_URI missing");
    await mongoose.connect(uri);
    
    const db = mongoose.connection.db;
    if (!db) throw new Error("DB connection failed");
    const brands = await db.collection('brands').find({ isDeleted: { $ne: true } }).limit(3).toArray();
    console.log("SAMPLE BRANDS IN DB:");
    console.log(JSON.stringify(brands, null, 2));
    
    await mongoose.disconnect();
}

debug();
