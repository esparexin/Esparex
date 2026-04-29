/**
 * Migration: fix-brand-name-unique-index
 *
 * The existing `brand_name_unique_ci` index on the `brands` collection was
 * created without a `partialFilterExpression`.  The schema now requires that
 * expression so that only active/pending brands are covered by the unique
 * constraint.  MongoDB does not allow redefining an index with the same name,
 * so we drop the old index here; Mongoose will recreate it with the correct
 * definition on the next server start.
 */

const COLLECTION = 'brands';
const INDEX_NAME = 'brand_name_unique_ci';

module.exports = {
  async up(db) {
    const collection = db.collection(COLLECTION);

    // Check whether the collection exists before touching it.
    const exists = await db
      .listCollections({ name: COLLECTION }, { nameOnly: true })
      .hasNext();

    if (!exists) {
      console.log(`[${INDEX_NAME}] Collection "${COLLECTION}" does not exist – skipping.`);
      return;
    }

    // Only drop the index if it currently exists without a partialFilterExpression.
    const indexes = await collection.indexes();
    const existing = indexes.find((idx) => idx.name === INDEX_NAME);

    if (!existing) {
      console.log(`[${INDEX_NAME}] Index not found – nothing to drop.`);
      return;
    }

    if (existing.partialFilterExpression) {
      console.log(`[${INDEX_NAME}] Index already has partialFilterExpression – no action needed.`);
      return;
    }

    await collection.dropIndex(INDEX_NAME);
    console.log(`[${INDEX_NAME}] Dropped old index without partialFilterExpression.`);
  },

  async down(db) {
    // Restore the old index without partialFilterExpression (pre-migration state).
    const collection = db.collection(COLLECTION);

    const exists = await db
      .listCollections({ name: COLLECTION }, { nameOnly: true })
      .hasNext();

    if (!exists) return;

    const indexes = await collection.indexes();
    const existing = indexes.find((idx) => idx.name === INDEX_NAME);

    if (existing) {
      await collection.dropIndex(INDEX_NAME);
    }

    await collection.createIndex(
      { name: 1 },
      {
        name: INDEX_NAME,
        unique: true,
        collation: { locale: 'en', strength: 2 },
      }
    );

    console.log(`[${INDEX_NAME}] Restored old index without partialFilterExpression.`);
  },
};
