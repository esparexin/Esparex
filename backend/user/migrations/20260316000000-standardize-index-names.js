'use strict';

/**
 * Migration: Standardize Index Names (Code-Only)
 * 
 * This migration serves as a record that index names in Mongoose models
 * have been aligned with the existing naming in MongoDB Atlas.
 * 
 * No structural changes are made to Atlas because the code is being updated
 * to match what is already live.
 */
module.exports = {
  async up() {
    // This is a code-only alignment. 
    // We document the standardization here for audit trails.
    console.log('Index names aligned in model files to match Atlas ground truth.');
  },

  async down() {
    // Reverting this would mean changing names back in model files.
    console.log('Rollback of index naming convention in model files is required to reverse this.');
  }
};
