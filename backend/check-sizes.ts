import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/esparex');
    const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));
    const ScreenSize = mongoose.model('ScreenSize', new mongoose.Schema({}, { strict: false }));
    const Brand = mongoose.model('Brand', new mongoose.Schema({}, { strict: false }));

    const category = await Category.findOne({ name: { $regex: /tv/i } });
    console.log('Category:', category);

    if (category) {
        const brands = await Brand.find({ categoryIds: category._id });
        console.log(`Found ${brands.length} brands for this category.`);
        
        const sizes = await ScreenSize.find({ categoryId: category._id });
        console.log(`Found ${sizes.length} screen sizes for this category.`);
        console.log('Sizes:', sizes.map(s => s.toObject()));
    } else {
        const allSizes = await ScreenSize.find({});
        console.log(`Found ${allSizes.length} total screen sizes in DB.`);
        if (allSizes.length > 0) {
            console.log('Sample single size:', allSizes[0].toObject());
        }
    }
    process.exit(0);
}

check().catch(console.error);
