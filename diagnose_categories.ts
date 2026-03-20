import mongoose from 'mongoose';
import { getAdminConnection } from './backend/src/config/db';
import Category from './backend/src/models/Category';

async function diagnoseCategories() {
    try {
        console.log('--- STARTING CATEGORY DIAGNOSIS ---');
        const adminConn = await getAdminConnection();
        
        // Wait for connection if initializing
        if (adminConn.readyState !== 1) {
            console.log('Waiting for DB connection...');
            await new Promise((resolve) => {
                adminConn.once('connected', () => {
                    console.log('DB Connected!');
                    resolve(true);
                });
            });
        }

        const allCategories = await Category.find({}).lean();
        console.log(`Total categories in DB: ${allCategories.length}`);

        const nonDeleted = allCategories.filter(c => c.isDeleted !== true);
        console.log(`Non-deleted categories: ${nonDeleted.length}`);

        const activeCategories = nonDeleted.filter(c => c.isActive === true);
        console.log(`Active categories (isActive=true): ${activeCategories.length}`);

        const liveCategories = nonDeleted.filter(c => c.status === 'live');
        console.log(`Live categories (status='live'): ${liveCategories.length}`);

        const statusCounts = nonDeleted.reduce((acc, c) => {
            acc[String(c.status)] = (acc[String(c.status)] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        console.log('Status counts (non-deleted):', statusCounts);

        const mismatched = nonDeleted.filter(c => c.isActive === true && c.status !== 'live');
        if (mismatched.length > 0) {
            console.log(`\nFound ${mismatched.length} categories with isActive=true but status != 'live'`);
            mismatched.forEach(c => {
                console.log(`- ${c.name} (ID: ${c._id}, status: ${c.status}, type: ${c.type})`);
            });
        }

        const listingTypeCounts = nonDeleted.reduce((acc, c) => {
            const types = Array.isArray(c.listingType) ? c.listingType : [c.listingType];
            types.forEach(t => {
                if (t) {
                    const key = String(t);
                    acc[key] = (acc[key] || 0) + 1;
                }
            });
            return acc;
        }, {} as Record<string, number>);
        console.log('\nListing type counts (non-deleted):', listingTypeCounts);

        console.log('\n--- DIAGNOSIS COMPLETE ---');
        process.exit(0);
    } catch (error) {
        console.error('Diagnosis failed:', error);
        process.exit(1);
    }
}

diagnoseCategories();
