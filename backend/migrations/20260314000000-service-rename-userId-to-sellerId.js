'use strict';

/**
 * Migration: Rename `userId` field to `sellerId` in the `services` collection.
 *
 * Canonical naming: the `Service` model uses `sellerId` (matching `Ad` and
 * `SparePartListing`) as its primary ownership field.  Legacy documents stored
 * before this migration have the field stored as `userId`.
 *
 * The old `userId` field is $unset after renaming to avoid stale data.
 */
module.exports = {
  async up(db) {
    await db.collection('services').updateMany(
      { userId: { $exists: true } },
      [
        { $set: { sellerId: '$userId' } },
        { $unset: 'userId' },
      ]
    );
  },

  async down(db) {
    await db.collection('services').updateMany(
      { sellerId: { $exists: true } },
      [
        { $set: { userId: '$sellerId' } },
        { $unset: 'sellerId' },
      ]
    );
  },
};
