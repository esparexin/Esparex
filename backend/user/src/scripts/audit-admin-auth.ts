
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import '@esparex/core/config/loadEnv';
import { env } from '@esparex/core/config/env';
import Admin from '@esparex/core/models/Admin';
import { connectDB } from '@esparex/core/config/db';
import logger from '@esparex/core/utils/logger';

async function auditAdmin() {
    try {
        console.log('🚀 STARTING ADMIN AUTH AUDIT...');
        console.log(`Environment: ${env.NODE_ENV}`);
        console.log(`Admin DB: ${env.ADMIN_MONGODB_URI?.split('@')[1] || 'Local'}`);

        await connectDB();
        console.log('✅ Connected to Database');

        const email = 'admin@esparex.com';
        const rawPassword = 'Admin@123';

        // 1. Find Admin with password
        const admin = await Admin.findOne({ email }).select('+password');

        if (!admin) {
            console.error(`❌ ERROR: Admin ${email} not found in database.`);
            process.exit(1);
        }

        console.log(`✅ Admin found: ${admin.firstName} ${admin.lastName}`);
        console.log(`Status: ${admin.status}`);
        console.log(`Role: ${admin.role}`);

        if (!admin.password) {
            console.error('❌ ERROR: Admin has no password hash set.');
        } else {
            // 2. Test Comparison
            console.log('🔍 Testing password comparison...');
            const isMatch = await bcrypt.compare(rawPassword, admin.password);
            
            if (isMatch) {
                console.log('✨ SUCCESS: Password "Admin@123" matches the hash in DB.');
            } else {
                console.log('❌ FAILURE: Password "Admin@123" does NOT match the hash in DB.');
                
                console.log('🛠️ Attempting Force-Reset...');
                const salt = await bcrypt.genSalt(10);
                const newHash = await bcrypt.hash(rawPassword, salt);
                
                const result = await Admin.updateOne(
                    { _id: admin._id },
                    { $set: { password: newHash, status: 'live' } }
                );

                if (result.modifiedCount > 0) {
                    console.log('✅ FORCE-RESET SUCCESSFUL: Password hash manually updated in DB.');
                } else {
                    console.log('⚠️  UPDATE SKIPPED: No documents modified (already matched?)');
                }
            }
        }

        console.log('\n--- AUDIT COMPLETE ---');
        process.exit(0);

    } catch (error) {
        console.error('💥 CRITICAL AUDIT FAILURE:', error);
        process.exit(1);
    }
}

auditAdmin();
