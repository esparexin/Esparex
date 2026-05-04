/**
 * Admin Auth Middleware — backend/admin workspace shim.
 * SSOT: core/src/middleware/adminAuth.ts
 *
 * Do NOT add logic here. All changes must go to @esparex/core/middleware/adminAuth.
 */
export {
    extractAdminToken,
    requireAdmin,
    requirePermission,
    requireRole,
    requireSuperAdmin,
} from '@esparex/core/middleware/adminAuth';
