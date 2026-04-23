import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { reverseGeocode } from '../services/location/ReverseGeocodeService';

async function debugGeocode() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/esparex';
    console.log(`Connecting to DB: ${uri}`);
    await mongoose.connect(uri);
    console.log('Connected to DB');

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
