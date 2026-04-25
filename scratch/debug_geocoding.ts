import mongoose from 'mongoose';
import { connectDB } from '../core/src/config/db';
import { reverseGeocode } from '../core/src/services/location/ReverseGeocodeService';

async function test() {
    await connectDB();
    // Use some coordinates close to a known city
    console.log("Testing reverse geocode...");
    try {
        const result = await reverseGeocode(19.0760, 72.8777); // Mumbai approximate coords
        console.log("Result:", result);
    } catch (e) {
        console.error(e);
    }
    await mongoose.disconnect();
}

test();
