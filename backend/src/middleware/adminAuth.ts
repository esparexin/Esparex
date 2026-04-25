/**
 * Admin Auth Middleware — backend workspace shim.
 * SSOT: core/src/middleware/adminAuth.ts
 *
 * Do NOT add logic here. All changes must go to @core/middleware/adminAuth.
 */
export {
    extractAdminToken,
    requireAdmin,
    requirePermission,
    requireRole,
    requireSuperAdmin,
} from '@core/middleware/adminAuth';
