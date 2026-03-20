import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/esparex';

const validatePerformance = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri);

        const SmartAlert = mongoose.connection.collection('smartalerts');

        const Ad = mongoose.connection.collection('ads');

        console.log('\n===========================================');
        console.log('🚄 PERFORMANCE VALIDATION: ADS');
        console.log('===========================================\n');

        const adExplain = await Ad.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [72.8777, 19.076] },
                    distanceField: "distance",
                    maxDistance: 500000,
                    query: { status: "active" },
                    spherical: true
                }
            }
        ]).explain("executionStats") as any;

        const adPlanner = adExplain.queryPlanner || (adExplain[0]?.queryPlanner);
        const adFullString = JSON.stringify(adExplain);
        const adHasGeo = adFullString.includes('GEO_NEAR_2DSPHERE') || adFullString.includes('2dsphere');
        const adHasCollScan = adFullString.includes('COLLSCAN');

        console.log(`Index Usage: ${adHasGeo ? '✅ 2dsphere index detected' : '❌ NO GEO INDEX DETECTED'}`);
        console.log(`Collection Scan: ${adHasCollScan ? '❌ COLLSCAN DETECTED' : '✅ NO COLLSCAN'}`);

        console.log('\n===========================================');
        console.log('🚄 PERFORMANCE VALIDATION: SMARTALERTS');
        console.log('===========================================\n');

        // Sample query to explain
        const explainResult = await SmartAlert.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [72.8777, 19.076] },
                    distanceField: "distanceFromAd",
                    maxDistance: 500000,
                    query: { isActive: true },
                    spherical: true
                }
            },
            {
                $match: {
                    $expr: {
                        $lte: ["$distanceFromAd", { $multiply: [50, 1000] }]
                    }
                }
            }
        ]).explain("executionStats") as any;

        // More robust parsing for different MongoDB/driver versions
        const queryPlanner = explainResult.queryPlanner || (explainResult[0]?.queryPlanner);
        const executionStats = explainResult.executionStats || (explainResult[0]?.executionStats);

        if (queryPlanner) {
            console.log('Query Planner Winning Plan Stage:', queryPlanner.winningPlan?.stage || 'Unknown');
        } else {
            console.log('No direct queryPlanner found. Inspecting full result for indicators.');
        }

        const fullString = JSON.stringify(explainResult);
        const hasGeoNear = fullString.includes('GEO_NEAR_2DSPHERE') || fullString.includes('2dsphere');
        const hasCollScan = fullString.includes('COLLSCAN');

        console.log(`\nIndex Usage: ${hasGeoNear ? '✅ 2dsphere index detected' : '❌ NO GEO INDEX DETECTED'}`);
        console.log(`Collection Scan: ${hasCollScan ? '❌ COLLSCAN DETECTED' : '✅ NO COLLSCAN'}`);

        if (executionStats) {
            console.log(`Documents Examined: ${executionStats.totalDocsExamined}`);
            console.log(`Execution Time (ms): ${executionStats.executionTimeMillis}`);
        }

        console.log('\n===========================================');
        if (hasGeoNear && !hasCollScan) {
            console.log('🎉 PERFORMANCE VALIDATED. Efficient index usage confirmed.');
        } else {
            console.log('⚠️ PERFORMANCE RISK detected.');
        }
        console.log('===========================================\n');

    } catch (error) {
        console.error('Validation failed:', error);
    } finally {
        await mongoose.disconnect();
    }
};

validatePerformance();
