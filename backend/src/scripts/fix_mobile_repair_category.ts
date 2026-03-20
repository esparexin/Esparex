import mongoose from 'mongoose';
import { getAdminConnection } from '../config/db';
import Category from '../models/Category';

async function fixMobileRepairCategory() {
    console.log('--- STARTING MOBILE REPAIR CATEGORY FIX ---');
    
    // Ensure admin connection is established
    const adminConn = await getAdminConnection();
    if (adminConn.readyState !== 1) {
        await new Promise((resolve) => adminConn.once('connected', resolve));
    }

    console.log('Connected to Database. Processing updates...');

    // Find and update mobile-repair category
    const result = await Category.updateOne(
        { slug: 'mobile-repair' },
        { 
            $set: { 
                type: 'SERVICE',
                listingType: ['postservice']
            } 
        }
    );

    if (result.matchedCount === 0) {
        console.warn("WARNING: Category with slug 'mobile-repair' not found.");
    } else {
        console.log(`Successfully updated 'mobile-repair' category. Modified count: ${result.modifiedCount}`);
    }

    console.log('--- FIX COMPLETE ---');
    process.exit(0);
}

fixMobileRepairCategory().catch(error => {
    console.error('Fix failed:', error);
    process.exit(1);
});
