import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

// Manually mock the required imports for the debug script
import { reverseGeocode } from './backend/src/services/location/ReverseGeocodeService';

async function debugGeocode() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/esparex');
    console.log('Connected to DB');

    // Test coordinates:
    // 1. Bangalore (approx): 12.97, 77.59
    // 2. Hyderabad (approx): 17.38, 78.48
    // 3. A random small city in AP: 15.82, 78.03 (Kurnool)

    const tests = [
      { lat: 12.9716, lng: 77.5946, name: 'Bangalore' },
      { lat: 17.3850, lng: 78.4867, name: 'Hyderabad' },
      { lat: 15.8284, lng: 78.0373, name: 'Kurnool' }
    ];

    for (const test of tests) {
      console.log(`\nTesting ${test.name} (${test.lat}, ${test.lng})...`);
      const result = await reverseGeocode(test.lat, test.lng);
      console.log(`Result:`, JSON.stringify(result, null, 2));
    }

  } catch (err) {
    console.error('Error during debug:', err);
  } finally {
    await mongoose.disconnect();
  }
}

debugGeocode();
