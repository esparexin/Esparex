"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installSafeSoftDeleteQuery = installSafeSoftDeleteQuery;
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
function installSafeSoftDeleteQuery(schema) {
    /**
     * .active() - Returns only active, non-deleted documents
     * Apply this to all public queries for safety
     */
    schema.query.active = function () {
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
    schema.query.includeDeleted = function () {
        // No filter applied - returns everything
        // Could add logging here for audit trail
        console.warn('⚠️ Query.includeDeleted() - Including deleted documents. ' +
            'Ensure proper authorization.');
        return this;
    };
    /**
     * Helper method on documents
     */
    schema.methods.isDeletedByUser = function () {
        return Boolean(this.isDeleted && !this.isActive);
    };
    /**
     * Helper method to get both active and deleted counts
     */
    schema.static('countActive', async function () {
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
//# sourceMappingURL=safeSoftDeleteQuery.js.map