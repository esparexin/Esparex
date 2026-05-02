/**
 * Migration: fix-model-brand-name-unique-index
 *
 * The existing `model_brand_name_unique_ci` index on the `models` collection
 * was created without a `partialFilterExpression`.  The schema now requires
 * one so that uniqueness is only enforced on active/pending models.
 * MongoDB does not allow redefining an index with the same name, so we drop
 * the old index here; Mongoose will recreate it with the correct definition
 * on the next server start.
 */

const COLLECTION = 'models';
const INDEX_NAME = 'model_brand_name_unique_ci';

module.exports = {
  async up(db) {
    const exists = await db
      .listCollections({ name: COLLECTION }, { nameOnly: true })
      .hasNext();

    if (!exists) {
      console.log(`[${INDEX_NAME}] Collection "${COLLECTION}" does not exist – skipping.`);
      return;
    }

    const indexes = await db.collection(COLLECTION).indexes();
    const existing = indexes.find((idx) => idx.name === INDEX_NAME);

    if (!existing) {
      console.log(`[${INDEX_NAME}] Index not found – nothing to drop.`);
      return;
    }

    if (existing.partialFilterExpression) {
      console.log(`[${INDEX_NAME}] Index already has partialFilterExpression – no action needed.`);
      return;
    }

    await db.collection(COLLECTION).dropIndex(INDEX_NAME);
    console.log(`[${INDEX_NAME}] Dropped old index without partialFilterExpression.`);
  },

  async down(db) {
    const exists = await db
      .listCollections({ name: COLLECTION }, { nameOnly: true })
      .hasNext();

    if (!exists) return;

    const indexes = await db.collection(COLLECTION).indexes();
    const existing = indexes.find((idx) => idx.name === INDEX_NAME);
    if (existing) {
      await db.collection(COLLECTION).dropIndex(INDEX_NAME);
    }

    await db.collection(COLLECTION).createIndex(
      { brandId: 1, name: 1 },
      {
        name: INDEX_NAME,
        unique: true,
        collation: { locale: 'en', strength: 2 },
      }
    );

    console.log(`[${INDEX_NAME}] Restored old index without partialFilterExpression.`);
  },
};
