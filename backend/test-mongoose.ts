import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

async function check() {
    await mongoose.connect(process.env.ADMIN_MONGODB_URI || 'mongodb://127.0.0.1:27017/esparex_admin');
    const Category = mongoose.model('Category', new mongoose.Schema({ status: String, isActive: Boolean, isDeleted: Boolean }, { strict: false }));
    
    // String in $in
    const c1 = await Category.find({ _id: { $in: ["692fae5f264647e70b11bfdd"] } }).lean();
    console.log('Result with String inside $in:', c1.length);
    
    process.exit(0);
}

check().catch(console.error);
