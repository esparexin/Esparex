import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import logger from '../utils/logger';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { reverseGeocode } from '../services/location/ReverseGeocodeService';

async function debugGeocode() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/esparex';
    logger.info(`Connecting to DB: ${uri}`);
    await mongoose.connect(uri);
    logger.info('Connected to DB');

    const tests = [
      { lat: 12.9716, lng: 77.5946, name: 'Bangalore' },
      { lat: 17.3850, lng: 78.4867, name: 'Hyderabad' },
      { lat: 15.8284, lng: 78.0373, name: 'Kurnool' }
    ];

    for (const test of tests) {
      logger.info(`Testing ${test.name} (${test.lat}, ${test.lng})...`);
      const result = await reverseGeocode(test.lat, test.lng);
      logger.info(`Result: ${JSON.stringify(result, null, 2)}`);
    }

  } catch (err) {
    logger.error('Error during debug:', err);
  } finally {
    await mongoose.disconnect();
  }
}

void debugGeocode();
