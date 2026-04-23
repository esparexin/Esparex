import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

const locationSchema = new mongoose.Schema({
  name: String,
  level: String,
  verificationStatus: String,
  isActive: Boolean,
  city: String,
  state: String,
  coordinates: {
      type: { type: String },
      coordinates: [Number]
  }
}, { strict: false });

const Location = mongoose.model('Location', locationSchema);

async function checkLocations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/esparex');
    console.log('Connected to DB');

    const counts = await Location.aggregate([
      { $group: { _id: { level: '$level', status: '$verificationStatus' }, count: { $sum: 1 } } }
    ]);

    const hyderabad = await Location.find({ name: /Hyderabad/i }).limit(5);
    const others = await Location.find({ name: { $not: /Hyderabad/i }, level: 'city' }).limit(5);

    fs.writeFileSync('scratch/db_results.json', JSON.stringify({ counts, hyderabad, others }, null, 2));
    console.log('Results written to scratch/db_results.json');

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

checkLocations();
