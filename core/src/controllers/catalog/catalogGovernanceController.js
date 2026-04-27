"use strict";
/**
 * Catalog Governance Controller
 * Handles hierarchy reporting, repairs, and category health metrics
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoryHealth = exports.runHierarchyRepair = exports.getHierarchyTree = exports.getHierarchyReport = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const CatalogHierarchyService_1 = require("@core/services/catalog/CatalogHierarchyService");
const respond_1 = require("@core/utils/respond");
const shared_1 = require("./shared");
const CatalogGovernanceService_1 = require("@core/services/catalog/CatalogGovernanceService");
const errorResponse_1 = require("@core/utils/errorResponse");
const adminLogger_1 = require("@core/utils/adminLogger");
const redisCache_1 = require("@core/utils/redisCache");
const logger_1 = __importDefault(require("@core/utils/logger"));
const HIERARCHY_TREE_CACHE_KEY = 'catalog:hierarchy-tree';
const HIERARCHY_CACHE_TTL = 3600; // 1 hour
/**
 * GET /governance/hierarchy-report
 * Returns a scan of the full catalog hierarchy and integrity issues.
 */
const getHierarchyReport = async (req, res) => {
    try {
        if (!(0, shared_1.hasAdminAccess)(req)) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 403, 'Admin access required');
        }
        const report = await (0, CatalogHierarchyService_1.scanHierarchyIntegrity)();
        (0, respond_1.sendSuccessResponse)(res, report);
    }
    catch (error) {
        (0, shared_1.sendCatalogError)(req, res, error);
    }
};
exports.getHierarchyReport = getHierarchyReport;
/**
 * GET /governance/hierarchy-tree
 * Returns the full category → brand → model tree without client-side pagination fan-out.
 */
const getHierarchyTree = async (req, res) => {
    try {
        if (!(0, shared_1.hasAdminAccess)(req)) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 403, 'Admin access required');
        }
        // Try the cache first
        const cached = await (0, redisCache_1.getCache)(HIERARCHY_TREE_CACHE_KEY);
        if (cached) {
            return (0, respond_1.sendSuccessResponse)(res, cached);
        }
        const tree = await (0, CatalogHierarchyService_1.getHierarchyTree)();
        // Cache the result
        await (0, redisCache_1.setCache)(HIERARCHY_TREE_CACHE_KEY, tree, HIERARCHY_CACHE_TTL).catch((err) => {
            logger_1.default.error('Failed to cache hierarchy tree', { error: err instanceof Error ? err.message : String(err) });
        });
        (0, respond_1.sendSuccessResponse)(res, tree);
    }
    catch (error) {
        (0, shared_1.sendCatalogError)(req, res, error);
    }
};
exports.getHierarchyTree = getHierarchyTree;
/**
 * POST /governance/repair-hierarchy
 * Triggers lightweight repairs for the catalog hierarchy.
 * Restricted to super admins.
 */
const runHierarchyRepair = async (req, res) => {
    try {
        const authUser = req.user;
        const isSuperAdmin = authUser.role === 'super_admin';
        if (!isSuperAdmin) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 403, 'Super admin access required for catalog repair');
        }
        const summary = await (0, CatalogHierarchyService_1.repairHierarchy)();
        await (0, adminLogger_1.logAdminAction)(req, 'CATALOG_HIERARCHY_REPAIR', 'System', undefined, {
            summary
        });
        (0, respond_1.sendSuccessResponse)(res, summary, 'Catalog hierarchy repair completed');
    }
    catch (error) {
        (0, shared_1.sendCatalogError)(req, res, error);
    }
};
exports.runHierarchyRepair = runHierarchyRepair;
/**
 * GET /governance/categories/:id/health
 * Returns metrics and health indicators for a specific category.
 */
const getCategoryHealth = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== 'string' || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 400, 'Invalid Category ID');
        }
        const category = await (0, CatalogGovernanceService_1.findCategoryByIdLean)(id);
        if (!category) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 404, 'Category not found');
        }
        // Metrics aggregation
        const { adStats, brandCount, modelCount } = await (0, CatalogGovernanceService_1.getCategoryHealthMetrics)(id);
        const stats = adStats[0] ?? { count: 0, avgQuality: 0, liveCount: 0 };
        const totalModels = modelCount[0]?.total ?? 0;
        const health = {
            categoryId: id,
            categoryName: category.name,
            metrics: {
                totalAds: stats.count,
                liveAds: stats.liveCount,
                avgQualityScore: stats.avgQuality ? parseFloat(stats.avgQuality.toFixed(2)) : 0,
                totalBrands: brandCount,
                totalModels
            },
            status: category.isActive ? 'active' : 'inactive'
        };
        (0, respond_1.sendSuccessResponse)(res, health);
    }
    catch (error) {
        (0, shared_1.sendCatalogError)(req, res, error);
    }
};
exports.getCategoryHealth = getCategoryHealth;
//# sourceMappingURL=catalogGovernanceController.js.map