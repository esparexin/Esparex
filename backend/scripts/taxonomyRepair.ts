import mongoose from "mongoose";
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Category from "../src/models/Category";
import Brand from "../src/models/Brand";
import Model from "../src/models/Model";
import Ad from "../src/models/Ad";

async function run() {
  try {
    console.log("🚀 TAXONOMY REPAIR START");
    mongoose.set('bufferCommands', true);
    
    const uri = process.env.ADMIN_MONGODB_URI;
    if (!uri) throw new Error("ADMIN_MONGODB_URI is undefined");
    
    console.log("Connecting database...");
    await mongoose.connect(uri);
    
    // ---------- 0. BACKUP SAFETY CHECK ----------
    console.log("⚠️ Reminder: Make sure you ran mongodump before this script!");

    // ---------- FIX BRAND MULTI CATEGORY ----------
    console.log("Analyzing Brands...");
    const brands = await Brand.find({ isDeleted: { $ne: true } });
    
    let brandsNormalized = 0;
    for (const brand of brands) {
       // Using untyped access because the schema will change soon
       const b = brand as any; 
       if (b.categoryIds && b.categoryIds.length > 0) {
           b.categoryId = b.categoryIds[0];
       }
       b.categoryIds = undefined;
       await b.save();
       brandsNormalized++;
    }
    console.log(`✅ ${brandsNormalized} Brands normalized to single categoryId`);

    // ---------- REMOVE MODEL CATEGORY DRIFT ----------
    const modelUpdateRes = await Model.updateMany(
      {},
      { $unset: { categoryId: "" } }
    );
    console.log(`✅ Models categoryId removed. Modified count: ${modelUpdateRes.modifiedCount}`);

    // ---------- SOFT DELETE ORPHAN BRANDS ----------
    const validCategoryIds = await Category.find({ isDeleted: { $ne: true } }).distinct("_id");
    
    const orphanBrandRes = await Brand.updateMany(
      { categoryId: { $nin: validCategoryIds }, isDeleted: { $ne: true } },
      { $set: { isActive: false, isDeleted: true } }
    );
    console.log(`✅ Orphan brands deactivated. Count: ${orphanBrandRes.modifiedCount}`);

    // ---------- SOFT DELETE ORPHAN MODELS ----------
    const validBrandIds = await Brand.find({ isDeleted: { $ne: true } }).distinct("_id");
    
    const orphanModelRes = await Model.updateMany(
      { brandId: { $nin: validBrandIds }, isDeleted: { $ne: true } },
      { $set: { isActive: false, isDeleted: true } }
    );
    console.log(`✅ Orphan models deactivated. Count: ${orphanModelRes.modifiedCount}`);

    console.log("🎯 TAXONOMY REPAIR COMPLETE");
    process.exit(0);

  } catch (e) {
      console.error("FATAL ERROR", e);
      process.exit(1);
  }
}

run();
