import mongoose from 'mongoose';
import { getAdminConnection } from '../config/db';
import Category from '../models/Category';

async function migrateCategoryTypes() {
    console.log('--- STARTING CATEGORY TYPE MIGRATION ---');
    
    // Ensure admin connection is established
    const adminConn = await getAdminConnection();
    if (adminConn.readyState !== 1) {
        await new Promise((resolve) => adminConn.once('connected', resolve));
    }

    console.log('Connected to Database. Processing updates...');

    // 1. device -> AD
    const adResult = await Category.updateMany(
        { type: 'device' as any },
        { $set: { type: 'AD' } }
    );
    console.log(`Updated 'device' to 'AD': ${adResult.modifiedCount} categories.`);

    // 2. service -> SERVICE
    const serviceResult = await Category.updateMany(
        { type: 'service' as any },
        { $set: { type: 'SERVICE' } }
    );
    console.log(`Updated 'service' to 'SERVICE': ${serviceResult.modifiedCount} categories.`);

    // 3. spare_part -> SPARE_PART
    const sparePartResult = await Category.updateMany(
        { type: 'spare_part' as any },
        { $set: { type: 'SPARE_PART' } }
    );
    console.log(`Updated 'spare_part' to 'SPARE_PART': ${sparePartResult.modifiedCount} categories.`);

    // 4. other -> OTHER
    const otherResult = await Category.updateMany(
        { type: 'other' as any },
        { $set: { type: 'OTHER' } }
    );
    console.log(`Updated 'other' to 'OTHER': ${otherResult.modifiedCount} categories.`);

    console.log('--- MIGRATION COMPLETE ---');
    process.exit(0);
}

migrateCategoryTypes().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
});
