import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/esparex');
    const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));
    const categories = await Category.find({}, { name: 1, hasScreenSizes: 1 }).lean();
    console.log('Categories:', categories);
    process.exit(0);
}

check().catch(console.error);
