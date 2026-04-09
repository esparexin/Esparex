import { Schema, Query } from 'mongoose';

/**
 * Safe Soft-Delete Query Scope Plugin
 * 
 * Prevents accidental exposure of soft-deleted data by:
 * 1. Adding .active() chain method (applies safety filter)
 * 2. Adding .includeDeleted() chain for intentional admin access
 * 3. Making safety filter explicit in all queries
 * 
 * Usage:
 *   // Safe (filters deleted automatically)
 *   Brand.find().active()
 * 
 *   // Explicit (shows intent)
 *   Brand.find().includeDeleted()  // Admin only!
 * 
 * @param schema - Mongoose schema to augment with safe query methods
 */
export function installSafeSoftDeleteQuery(schema: Schema) {
    /**
     * .active() - Returns only active, non-deleted documents
     * Apply this to all public queries for safety
     */
    (schema.query as any).active = function (this: Query<any, any>) {
        return this.where({
            isDeleted: { $ne: true }
        }).where({
            isActive: true
        });
    };

    /**
     * .includeDeleted() - Returns all documents including deleted
     * Use ONLY in admin contexts after auth check
     * 
     * Logs a warning for audit purposes
     */
    (schema.query as any).includeDeleted = function (this: Query<any, any>) {
        // No filter applied - returns everything
        // Could add logging here for audit trail
        console.warn(
            '⚠️ Query.includeDeleted() - Including deleted documents. ' +
            'Ensure proper authorization.'
        );
        return this;
    };

    /**
     * Helper method on documents
     */
    schema.methods.isDeletedByUser = function (this: any): boolean {
        return Boolean(this.isDeleted && !this.isActive);
    };

    /**
     * Helper method to get both active and deleted counts
     */
    schema.static('countActive', async function (this: any) {
        return Promise.all([
            this.countDocuments({ isDeleted: { $ne: true }, isActive: true }),
            this.countDocuments({ isDeleted: true })
        ]);
    });
}

/**
 * NOTE: Custom query methods (.active(), .includeDeleted()) are added dynamically via schema.query
 * TypeScript will recognize these methods when importing from models that use this plugin
 * ESLint may warn about unknown properties; use @ts-ignore if needed in client code
 */
