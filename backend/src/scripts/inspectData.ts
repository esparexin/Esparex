import mongoose from 'mongoose';
import Brand from '../models/Brand';
import Category from '../models/Category';
import { connectDB } from '../config/db';

async function inspectData() {
    try {
        await connectDB();
        
        console.log('\n[BRAND SAMPLE]');
        const brands = await Brand.find({}).limit(5).lean();
        console.log(JSON.stringify(brands, null, 2));
        
        console.log('\n[CATEGORY SAMPLE]');
        const categories = await Category.find({}).limit(5).lean();
        console.log(JSON.stringify(categories, null, 2));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

inspectData();
