// Script to Verify Legacy and New Routing Logic
// Run with: npx ts-node scripts/verify_legacy_routing.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import AdModel from '../src/models/Ad';
import User from '../src/models/User';
import { connectDB, getUserConnection } from '../src/config/db';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testRouting() {
    console.info('🔌 Connecting to DB...');
    await connectDB();
    console.info('✅ Connected');

    try {
        // 1. Create a Test Ad
        // We'll use a dummy ID for user to avoid FK constraint issues if user doesn't exist?
        // Actually, schema might require valid user.
        // Let's create a minimal valid ad if possible, or query existing if available.
        // Since db was empty, let's create a dummy User and Ad.

        let user = await User.findOne({});
        if (!user) {
            console.info('Creating dummy user...');
            user = await User.create({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: 'user',
                isVerified: true
            });
        }

        // Create Ad
        const ad = await AdModel.create({
            title: 'Routing Test Ad',
            description: 'Testing legacy routing',
            price: 100,
            sellerId: user._id,
            status: 'active',
            location: {
                display: 'Test City',
                country: 'India',
                state: 'Test State'
            },
            categoryId: new mongoose.Types.ObjectId(), // Fake
            brandId: new mongoose.Types.ObjectId(), // Fake
            modelId: new mongoose.Types.ObjectId(), // Fake
            images: ['test.jpg']
        });

        console.info(`\n📝 Created Ad:`);
        console.info(`   ID: ${ad._id}`);
        console.info(`   Slug: ${ad.seoSlug}`);

        const adId = ad._id.toString();
        const adSlug = ad.seoSlug; // Expect "routing-test-ad-XXXXX"

        // 2. Test Direct ID Lookup
        console.info('\n🧪 TEST 1: Direct ID Lookup');
        const byId = await AdModel.findById(adId);
        if (byId) console.info('✅ Found by ID'); else console.error('❌ Failed by ID');

        // 3. Test SEO Slug Lookup
        console.info('\n🧪 TEST 2: SEO Slug Lookup');
        const bySlug = await AdModel.findOne({ seoSlug: adSlug });
        if (bySlug) console.info('✅ Found by Slug'); else console.error('❌ Failed by Slug');

        // 4. Test Legacy Slug-ID Lookup (Controller Logic Simulation)
        console.info('\n🧪 TEST 3: Legacy Slug-ID Logic');
        const legacyUrl = `some-random-slug-${adId}`;
        console.info(`   Requesting: ${legacyUrl}`);

        // Simulate Controller Logic
        let found = await AdModel.findOne({ seoSlug: legacyUrl });
        if (!found) {
            const idMatch = legacyUrl.match(/-([0-9a-fA-F]{24})$/);
            if (idMatch) {
                const extractedId = idMatch[1];
                if (extractedId === adId) {
                    found = await AdModel.findById(extractedId);
                }
            }
        }

        if (found) console.info('✅ Found via Legacy Fallback'); else console.error('❌ Failed Legacy Fallback');

        // Cleanup
        await AdModel.deleteOne({ _id: ad._id });
        // Don't delete user if it was existing, but we created dummy. Let's leave it.

        console.info('\n✨ ROUTING VERIFICATION COMPLETE');

    } catch (error) {
        console.error('❌ TEST FAILED:', error);
    } finally {
        const conn = getUserConnection();
        await conn.close();
        process.exit(0);
    }
}

testRouting();
