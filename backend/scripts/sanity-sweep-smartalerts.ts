import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables for local testing bypass if needed
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/esparex';

const sweepSmartAlerts = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri);

        const SmartAlert = mongoose.connection.collection('smartalerts');

        console.log('\n===========================================');
        console.log('🚨 LEGACY DATA SANITY SWEEP: SMARTALERTS');
        console.log('===========================================\n');

        // Check A: Missing Coordinates Array
        const missingCoords = await SmartAlert.countDocuments({
            'coordinates.coordinates': { $exists: false }
        });
        console.log(`[Check A] Alerts missing coordinates.coordinates: ${missingCoords} ${missingCoords === 0 ? '✅ PASS' : '❌ FAIL'}`);

        // Check B: Invalid array size [lng, lat]
        const invalidSizeCoords = await SmartAlert.countDocuments({
            $nor: [
                { 'coordinates.coordinates': { $size: 2 } },
                { 'coordinates.coordinates': { $exists: false } } // Don't double count Check A 
            ]
        });
        console.log(`[Check B] Alerts with coordinates not size 2: ${invalidSizeCoords} ${invalidSizeCoords === 0 ? '✅ PASS' : '❌ FAIL'}`);

        // Check C: Out of bounds Coordinates (-180 to 180, -90 to 90)
        const outOfBoundsCoords = await SmartAlert.countDocuments({
            $or: [
                { 'coordinates.coordinates.0': { $lt: -180 } },
                { 'coordinates.coordinates.0': { $gt: 180 } },
                { 'coordinates.coordinates.1': { $lt: -90 } },
                { 'coordinates.coordinates.1': { $gt: 90 } }
            ]
        });
        console.log(`[Check C] Alerts with out-of-bounds coordinates: ${outOfBoundsCoords} ${outOfBoundsCoords === 0 ? '✅ PASS' : '❌ FAIL'}`);

        // Check D: Corrupt Radius Data (missing or less than 1)
        const invalidRadius = await SmartAlert.countDocuments({
            $or: [
                { radiusKm: { $exists: false } },
                { radiusKm: { $lt: 1 } },
                { radiusKm: { $gt: 500 } }
            ]
        });
        console.log(`[Check D] Alerts with invalid or excessive radiusKm: ${invalidRadius} ${invalidRadius === 0 ? '✅ PASS' : '❌ FAIL'}`);


        console.log('\n===========================================');
        if (missingCoords === 0 && invalidSizeCoords === 0 && outOfBoundsCoords === 0 && invalidRadius === 0) {
            console.log('🎉 SWEEP PASSED. 100% Data Integrity confirmed.');
        } else {
            console.log('⚠️ SWEEP FAILED. Corrupt data detected.');
        }
        console.log('===========================================\n');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
    }
};

sweepSmartAlerts();
