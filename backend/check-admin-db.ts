import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

async function check() {
    await mongoose.connect(process.env.ADMIN_MONGODB_URI || 'mongodb://127.0.0.1:27017/esparex_admin');
    const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));
    const ScreenSize = mongoose.model('ScreenSize', new mongoose.Schema({}, { strict: false }));
    
    const categories = await Category.find({}, { name: 1, hasScreenSizes: 1 }).lean();
    console.log(`Found ${categories.length} Categories:`, categories);

    const tvCategory = await Category.findOne({ name: { $regex: /tv/i } }).lean();
    console.log('TV Category:', tvCategory);

    const sizes = await ScreenSize.find({}).lean();
    console.log(`Found ${sizes.length} ScreenSizes:`, sizes);

    process.exit(0);
}

check().catch(console.error);
