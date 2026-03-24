#!/usr/bin/env node

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const userUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/esparex_user';
const apply = process.argv.includes('--apply');

const isPlaceholderUrl = (value) => {
  if (typeof value !== 'string' || value.trim().length === 0) return false;
  try {
    return new URL(value).hostname.toLowerCase() === 'placehold.co';
  } catch {
    return false;
  }
};

const stripPlaceholderUrls = (value) =>
  Array.isArray(value)
    ? value.filter((entry) => typeof entry === 'string' && entry.trim().length > 0 && !isPlaceholderUrl(entry))
    : [];

async function run() {
  await mongoose.connect(userUri, { serverSelectionTimeoutMS: 20000 });
  const db = mongoose.connection.db;

  const ads = await db
    .collection('ads')
    .find({ images: { $elemMatch: { $regex: '^https://placehold\\.co/', $options: 'i' } } })
    .project({ images: 1, listingType: 1, title: 1 })
    .toArray();

  const businesses = await db
    .collection('businesses')
    .find({
      $or: [
        { images: { $elemMatch: { $regex: '^https://placehold\\.co/', $options: 'i' } } },
        { logo: { $regex: '^https://placehold\\.co/', $options: 'i' } },
        { coverImage: { $regex: '^https://placehold\\.co/', $options: 'i' } },
      ],
    })
    .project({ images: 1, logo: 1, coverImage: 1, name: 1 })
    .toArray();

  const users = await db
    .collection('users')
    .find({ avatar: { $regex: '^https://placehold\\.co/', $options: 'i' } })
    .project({ avatar: 1, name: 1, mobile: 1 })
    .toArray();

  const summary = {
    scannedAt: new Date().toISOString(),
    apply,
    counts: {
      ads: ads.length,
      businesses: businesses.length,
      users: users.length,
    },
    samples: {
      ads: ads.slice(0, 5).map((doc) => ({
        _id: String(doc._id),
        listingType: doc.listingType,
        title: doc.title,
        images: doc.images,
      })),
      businesses: businesses.slice(0, 5).map((doc) => ({
        _id: String(doc._id),
        name: doc.name,
        images: doc.images,
        logo: doc.logo,
        coverImage: doc.coverImage,
      })),
      users: users.slice(0, 5).map((doc) => ({
        _id: String(doc._id),
        name: doc.name,
        mobile: doc.mobile,
        avatar: doc.avatar,
      })),
    },
  };

  console.log(JSON.stringify(summary, null, 2));

  if (!apply) {
    await mongoose.disconnect();
    return;
  }

  const adOps = ads.map((doc) => ({
    updateOne: {
      filter: { _id: doc._id },
      update: { $set: { images: stripPlaceholderUrls(doc.images) } },
    },
  }));

  const businessOps = businesses.map((doc) => {
    const next = { images: stripPlaceholderUrls(doc.images) };
    const unset = {
      ...(isPlaceholderUrl(doc.logo) ? { logo: '' } : {}),
      ...(isPlaceholderUrl(doc.coverImage) ? { coverImage: '' } : {}),
    };
    return {
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: next,
          ...(Object.keys(unset).length > 0 ? { $unset: unset } : {}),
        },
      },
    };
  });

  const userOps = users.map((doc) => ({
    updateOne: {
      filter: { _id: doc._id },
      update: { $unset: { avatar: '' } },
    },
  }));

  const results = {
    ads: adOps.length > 0 ? await db.collection('ads').bulkWrite(adOps, { ordered: false }) : null,
    businesses: businessOps.length > 0 ? await db.collection('businesses').bulkWrite(businessOps, { ordered: false }) : null,
    users: userOps.length > 0 ? await db.collection('users').bulkWrite(userOps, { ordered: false }) : null,
  };

  console.log(
    JSON.stringify(
      {
        appliedAt: new Date().toISOString(),
        modified: {
          ads: results.ads?.modifiedCount || 0,
          businesses: results.businesses?.modifiedCount || 0,
          users: results.users?.modifiedCount || 0,
        },
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('[remediate-placeholder-images] Fatal error:', error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exitCode = 1;
});
