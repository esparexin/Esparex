import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../../backend/user/.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/esparex';

async function runQA() {
    console.log('🚀 Starting Esparex Location Migration QA Audit...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB.');

        const db = mongoose.connection.db!;
        
        // 1. Check for Legacy Fields in Ads
        console.log('\n🔍 Auditing Ads for legacy fields...');
        const legacyAds = await db.collection('ads').countDocuments({
            $or: [
                { lat: { $exists: true } },
                { lng: { $exists: true } },
                { latitude: { $exists: true } },
                { longitude: { $exists: true } }
            ]
        });

        if (legacyAds > 0) {
            console.log(`❌ FAILED: Found ${legacyAds} ads with legacy location fields.`);
        } else {
            console.log('✅ SUCCESS: No legacy location fields found in Ads.');
        }

        // 2. Check for Legacy Fields in Businesses
        console.log('\n🔍 Auditing Businesses for legacy fields...');
        const legacyBusinesses = await db.collection('businesses').countDocuments({
            $or: [
                { lat: { $exists: true } },
                { lng: { $exists: true } },
                { latitude: { $exists: true } },
                { longitude: { $exists: true } }
            ]
        });

        if (legacyBusinesses > 0) {
            console.log(`❌ FAILED: Found ${legacyBusinesses} businesses with legacy location fields.`);
        } else {
            console.log('✅ SUCCESS: No legacy location fields found in Businesses.');
        }

        // 3. Verify LocationId References in Ads
        console.log('\n🔍 Verifying locationId references in Ads...');
        const orphanedAds = await db.collection('ads').aggregate([
            {
                $lookup: {
                    from: 'locations',
                    localField: 'locationId',
                    foreignField: '_id',
                    as: 'locationDoc'
                }
            },
            {
                $match: {
                    locationId: { $exists: true, $ne: null },
                    locationDoc: { $size: 0 }
                }
            },
            { $count: 'count' }
        ]).toArray();

        const orphanAdCount = orphanedAds[0]?.count || 0;
        if (orphanAdCount > 0) {
            console.log(`❌ FAILED: Found ${orphanAdCount} ads with orphaned locationId references.`);
        } else {
            console.log('✅ SUCCESS: All Ads have valid locationId references.');
        }

        // 4. Verify GeoJSON Structure in Locations
        console.log('\n🔍 Verifying GeoJSON structure in Locations collection...');
        const invalidGeo = await db.collection('locations').countDocuments({
            $or: [
                { 'coordinates.type': { $ne: 'Point' } },
                { 'coordinates.coordinates': { $not: { $size: 2 } } },
                { 'coordinates.coordinates.0': { $type: 'string' } }, // Longitude should be number
                { 'coordinates.coordinates.1': { $type: 'string' } }  // Latitude should be number
            ]
        });

        if (invalidGeo > 0) {
            console.log(`❌ FAILED: Found ${invalidGeo} locations with invalid GeoJSON structure.`);
        } else {
            console.log('✅ SUCCESS: All Locations have valid GeoJSON structures.');
        }

        // 5. Check for null island [0,0]
        console.log('\n🔍 Checking for "Null Island" [0,0] locations...');
        const nullIsland = await db.collection('locations').countDocuments({
            'coordinates.coordinates': [0, 0]
        });

        if (nullIsland > 0) {
            console.log(`⚠️  WARNING: Found ${nullIsland} locations at Null Island [0,0].`);
        } else {
            console.log('✅ SUCCESS: No Null Island locations found.');
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🏁 QA Audit Complete.');

    } catch (error) {
        console.error('❌ QA Audit Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

runQA();
