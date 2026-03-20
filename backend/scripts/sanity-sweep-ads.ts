import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URI_USER;

async function runSanitySweep() {
    if (!MONGODB_URI) {
        console.error("❌ MONGODB_URI is required");
        process.exit(1);
    }

    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });

        const db = mongoose.connection.useDb('esparex');
        const adsCollection = db.collection('ads');

        console.log(`\n===========================================`);
        console.log(`🚨 LEGACY DATA SANITY SWEEP: ADS COLLECTION`);
        console.log(`===========================================\n`);

        // Check A: Check missing coordinates
        const missingCoords = await adsCollection.countDocuments({
            "location.coordinates": { $exists: false }
        });
        console.log(`[Check A] Ads missing location.coordinates: ${missingCoords} ${missingCoords > 0 ? '❌ FAIL' : '✅ PASS'}`);

        // Check B: Check invalid coordinate arrays (not size 2)
        const invalidCoordsSize = await adsCollection.countDocuments({
            "location.coordinates": { $exists: true, $not: { $size: 2 } }
        });
        console.log(`[Check B] Ads with location.coordinates not size 2: ${invalidCoordsSize} ${invalidCoordsSize > 0 ? '❌ FAIL' : '✅ PASS'}`);

        // Check C: Check out-of-bounds coords
        const outOfBoundsCoords = await adsCollection.countDocuments({
            "location.coordinates": { $exists: true },
            $or: [
                { "location.coordinates.0": { $gt: 180 } },
                { "location.coordinates.0": { $lt: -180 } },
                { "location.coordinates.1": { $gt: 90 } },
                { "location.coordinates.1": { $lt: -90 } }
            ]
        });
        console.log(`[Check C] Ads with out-of-bounds coordinates: ${outOfBoundsCoords} ${outOfBoundsCoords > 0 ? '❌ FAIL' : '✅ PASS'}`);

        console.log(`\n===========================================`);

        let shouldFail = false;
        if (missingCoords > 0 || invalidCoordsSize > 0 || outOfBoundsCoords > 0) {
            console.log(`🚨 SWEEP FAILED. Corrupt documents detected.`);
            shouldFail = true;
        } else {
            console.log(`🎉 SWEEP PASSED. 100% Data Integrity confirmed.`);
        }
        console.log(`===========================================\n`);

        await mongoose.disconnect();

        if (shouldFail) {
            process.exit(1);
        } else {
            process.exit(0);
        }

    } catch (error) {
        console.error("Error running sweep:", error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

runSanitySweep();
