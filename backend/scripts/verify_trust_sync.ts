import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables manually
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { connectDB } from '../src/config/db';

async function verifySync() {
    try {
        console.log('Connecting to database...');
        await connectDB();
        console.log('Connected.\n');

        const User = (await import('../src/models/User')).default;
        const Ad = (await import('../src/models/Ad')).default;
        const Category = (await import('../src/models/Category')).default;
        const { recalculateTrustScore } = await import('../src/services/trustService');

        // 1. Create test category
        const testCategory = await Category.create({ name: 'Test Category', slug: 'test-cat-' + Date.now(), isActive: true });

        // 2. Create a test user
        const testUser = await User.create({
            role: 'user',
            mobile: '+919999999999',
            isPhoneVerified: true,
            isEmailVerified: false,
            isVerified: false,
            trustScore: 50,
            strikeCount: 0,
            status: 'active',
            businessStatus: 'none',
            mobileVisibility: 'show',
            isChatBlocked: false,
            fcmTokens: [],
            notificationSettings: {
                newMessages: true,
                adUpdates: true,
                promotions: false,
                emailNotifications: true,
                pushNotifications: true,
                dailyDigest: false,
                instantAlerts: true
            }
        });
        console.log(`✅ Created test user: ${testUser._id} with initial trustScore: ${testUser.trustScore}`);

        // 3. Create an active test ad
        const testAd = await Ad.create({
            title: 'Test Snapshot Sync Ad',
            description: 'This is a test ad',
            price: 100,
            currency: 'INR',
            categoryId: testCategory._id,
            sellerId: testUser._id,
            sellerType: 'user',
            status: 'active', // Active!
            location: {
                coordinates: {
                    type: 'Point',
                    coordinates: [77.2090, 28.6139]
                }
            },
            sellerTrustSnapshot: 50 // starting point
        });
        console.log(`✅ Created test ad: ${testAd._id} with initial sellerTrustSnapshot: ${testAd.sellerTrustSnapshot}`);

        // 4. Force a trust score change by injecting a verified status
        testUser.isVerified = true;
        await testUser.save();

        console.log(`\n⏳ Triggering recalculateTrustScore for user ${testUser._id}...`);
        await recalculateTrustScore(testUser._id);

        // 5. Verify the ad snapshot
        const updatedAd = await Ad.findById(testAd._id);
        const updatedUser = await User.findById(testUser._id);

        console.log(`\n📊 Verification Results:`);
        console.log(`User.trustScore: ${updatedUser?.trustScore} (Expected: > 50 due to verified status)`);
        console.log(`Ad.sellerTrustSnapshot: ${updatedAd?.sellerTrustSnapshot} (Expected: matching User.trustScore)`);

        if (updatedUser?.trustScore === updatedAd?.sellerTrustSnapshot && updatedAd?.sellerTrustSnapshot !== 50) {
            console.log(`\n🎉 SUCCESS: Active Ad snapshot successfully synced with User trust score!`);
        } else {
            console.log(`\n❌ FAILED: Snapshot did not sync properly.`);
        }

        // Cleanup
        await Ad.findByIdAndDelete(testAd._id);
        await User.findByIdAndDelete(testUser._id);
        await Category.findByIdAndDelete(testCategory._id);

        await mongoose.disconnect();
        console.log("\nDisconnected.");
        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
}

verifySync();
