const mongoose = require('mongoose');
require('dotenv').config();

async function seed() {
  await mongoose.connect(process.env.ADMIN_MONGODB_URI);
  const db = mongoose.connection.db;
  
  // Seed categories
  const cats = await db.collection('categories').insertMany([
    { name: 'Mobiles', slug: 'mobiles', type: 'device', isActive: true, status: 'active', isDeleted: false, sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Laptops', slug: 'laptops', type: 'device', isActive: true, status: 'active', isDeleted: false, sortOrder: 2, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Tablets', slug: 'tablets', type: 'device', isActive: true, status: 'active', isDeleted: false, sortOrder: 3, createdAt: new Date(), updatedAt: new Date() },
  ]);
  console.log('Categories seeded:', cats.insertedCount);

  // Seed brands for Mobiles
  const mobilesCatId = cats.insertedIds[0];
  const brands = await db.collection('brands').insertMany([
    { name: 'Apple', slug: 'apple', categoryId: mobilesCatId, isActive: true, status: 'active', isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Samsung', slug: 'samsung', categoryId: mobilesCatId, isActive: true, status: 'active', isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
    { name: 'OnePlus', slug: 'oneplus', categoryId: mobilesCatId, isActive: true, status: 'active', isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
  ]);
  console.log('Brands seeded:', brands.insertedCount);

  // Seed models
  const appleId = brands.insertedIds[0];
  const models = await db.collection('models').insertMany([
    { name: 'iPhone 14', slug: 'iphone-14', brandId: appleId, categoryId: mobilesCatId, isActive: true, status: 'active', isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
    { name: 'iPhone 13', slug: 'iphone-13', brandId: appleId, categoryId: mobilesCatId, isActive: true, status: 'active', isDeleted: false, createdAt: new Date(), updatedAt: new Date() },
  ]);
  console.log('Models seeded:', models.insertedCount);

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
