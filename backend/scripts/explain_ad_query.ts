import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables manually
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { connectDB } from '../src/config/db';

async function verifyQuery() {
    try {
        console.log('Connecting to database...');
        await connectDB();
        console.log('Connected.\n');

        const getAdsModule = await import('../src/services/adQueryService');
        const getAds = getAdsModule.getAds;
        const Ad = (await import('../src/models/Ad')).default;

        console.log('⏳ Running getAds()...');

        // Make a standard getAds call
        const result = await getAds(
            { status: 'active', radiusKm: 50 },
            { page: 1, limit: 10 }
        );

        console.log(`✅ getAds Executed Successfully. Found ${result.data?.length || 0} ads.`);

        const testPipeline = [
            { $match: { status: 'active' } },
            {
                $addFields: {
                    hoursSince: { $divide: [{ $subtract: [new Date(), '$createdAt'] }, 1000 * 60 * 60] },
                    sellerTrust: { $ifNull: ['$sellerTrustSnapshot', 50] },
                    spotlightBonus: { $cond: ['$isSpotlight', 100, 0] },
                    distScore: { $cond: [{ $ifNull: ['$distance', false] }, { $divide: [10000, { $add: ['$distance', 100] }] }, 0] }
                }
            }
        ];

        const explain = await Ad.aggregate(testPipeline).option({ explain: true });

        console.log(`\n📊 Explain stats checked!`);
        console.log(JSON.stringify(explain, null, 2).substring(0, 500) + '... [truncated]');

        await mongoose.disconnect();
        console.log("\nDisconnected.");
        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
}

verifyQuery();
