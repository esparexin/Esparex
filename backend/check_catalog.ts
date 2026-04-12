import mongoose from 'mongoose';
import { loadEnvFiles } from './src/config/loadEnvFiles';
loadEnvFiles();

import Brand from './src/models/Brand';
import Model from './src/models/Model';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected to MongoDB.");

  const brands = await Brand.countDocuments();
  const activeBrands = await Brand.countDocuments({ 
    isActive: true, 
    $or: [{ status: 'active' }, { status: { $exists: false } }] 
  });
  
  const models = await Model.countDocuments();
  const activeModels = await Model.countDocuments({ 
    isActive: true, 
    $or: [{ status: 'active' }, { status: { $exists: false } }] 
  });
  
  console.log(`Total Brands: ${brands}, Active Brands: ${activeBrands}`);
  console.log(`Total Models: ${models}, Active Models: ${activeModels}`);

  process.exit(0);
}
run();
