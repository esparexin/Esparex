"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidate = exports.getStats = void 0;
const AdminCacheService_1 = require("@esparex/core/services/admin/AdminCacheService");
const adminBaseController_1 = require("@esparex/core/utils/adminBaseController");
const respond_1 = require("@esparex/core/utils/respond");
/**
 * GET /api/v1/admin/cache/stats
 * Fetch real-time Redis performance and health metrics
 */
const getStats = async (req, res) => {
    try {
        const stats = await AdminCacheService_1.AdminCacheService.getStats();
        res.json((0, respond_1.respond)({
            success: true,
            data: stats
        }));
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getStats = getStats;
/**
 * POST /api/v1/admin/cache/invalidate
 * Trigger manual invalidation by pattern
 */
const invalidate = async (req, res) => {
    try {
        const { pattern } = req.body;
        const result = await AdminCacheService_1.AdminCacheService.invalidatePattern(pattern);
        res.json((0, respond_1.respond)({
            success: true,
            data: result,
            message: `Cache invalidated for pattern: ${pattern}`
        }));
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.invalidate = invalidate;
//# sourceMappingURL=adminCacheController.js.map