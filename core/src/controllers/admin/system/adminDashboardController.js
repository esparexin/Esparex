"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocationAnalytics = exports.getRateLimitMetrics = exports.updateContactSubmissionStatus = exports.getContactSubmissions = exports.getRecentActivity = exports.getAnalytics = exports.getDashboardStats = exports.getStats = void 0;
const adminBaseController_1 = require("@esparex/core/utils/adminBaseController");
const requestParams_1 = require("@esparex/core/utils/requestParams");
const stringUtils_1 = require("@esparex/core/utils/stringUtils");
const redis_1 = require("@esparex/core/lib/redis");
const redisCache_1 = require("@esparex/core/utils/redisCache");
const FeedVisibilityGuard_1 = require("@esparex/core/utils/FeedVisibilityGuard");
const AdminDashboardService_1 = require("@esparex/core/services/AdminDashboardService");
const adminAnalyticsController = __importStar(require("../adminAnalyticsController"));
const sendDashboardError = (req, res, error) => {
    (0, adminBaseController_1.sendAdminError)(req, res, error);
};
const getStats = async (req, res) => {
    try {
        const publicAdFilter = (0, FeedVisibilityGuard_1.buildPublicAdFilter)();
        const { totalUsers, unifiedStats, pendingModels, openReports, pendingBusinesses, totalRevenueAgg } = await (0, AdminDashboardService_1.getDashboardOverviewStats)(publicAdFilter);
        const stats = unifiedStats[0];
        const totalAds = stats.totalAds[0]?.count || 0;
        const activeAds = stats.activeAds[0]?.count || 0;
        const pendingAds = stats.pendingAds[0]?.count || 0;
        const totalServices = stats.totalServices[0]?.count || 0;
        const activeServices = stats.activeServices[0]?.count || 0;
        const pendingServices = stats.pendingServices[0]?.count || 0;
        const rejectedServices = stats.rejectedServices[0]?.count || 0;
        const totalSpareParts = stats.totalSpareParts[0]?.count || 0;
        const activeSpareParts = stats.activeSpareParts[0]?.count || 0;
        const pendingSpareParts = stats.pendingSpareParts[0]?.count || 0;
        const totalRevenue = totalRevenueAgg[0]?.total || 0;
        (0, adminBaseController_1.sendSuccessResponse)(res, {
            totalUsers,
            totalAds,
            activeAds,
            pendingAds,
            totalServices,
            activeServices,
            pendingServices,
            rejectedServices,
            totalSpareParts,
            activeSpareParts,
            pendingSpareParts,
            notifications: {
                pendingModels,
                reportedAds: openReports,
                pendingBusinesses: pendingBusinesses,
                pendingAds: pendingAds
            },
            revenue: totalRevenue
        });
    }
    catch (error) {
        sendDashboardError(req, res, error);
    }
};
exports.getStats = getStats;
const getDashboardStats = async (req, res) => {
    try {
        const publicAdFilter = (0, FeedVisibilityGuard_1.buildPublicAdFilter)();
        const { totalUsers, adStats, totalReports, totalBusinesses, totalRevenueAgg } = await (0, AdminDashboardService_1.getDashboardCardStats)(publicAdFilter);
        const activeAds = adStats[0].live[0]?.count || 0;
        const pendingAds = adStats[0].pending[0]?.count || 0;
        const revenue = totalRevenueAgg[0]?.total || 0;
        (0, adminBaseController_1.sendSuccessResponse)(res, {
            totalUsers,
            activeAds,
            pendingAds,
            totalReports,
            totalBusinesses,
            revenue
        });
    }
    catch (error) {
        sendDashboardError(req, res, error);
    }
};
exports.getDashboardStats = getDashboardStats;
const getAnalytics = async (req, res) => {
    return adminAnalyticsController.getTimeSeriesAnalytics(req, res);
};
exports.getAnalytics = getAnalytics;
const getRecentActivity = async (req, res) => {
    try {
        const logs = await (0, AdminDashboardService_1.getRecentAdminLogs)(10);
        const activity = logs.map(log => {
            const admin = (log.adminId || {});
            return {
                title: log.action.replace(/_/g, ' '),
                description: `${admin?.firstName || 'Admin'} ${admin?.lastName || ''} - ${log.targetType} ${String(log.targetId || '')}`,
                time: log.createdAt
            };
        });
        (0, adminBaseController_1.sendSuccessResponse)(res, activity);
    }
    catch (error) {
        sendDashboardError(req, res, error);
    }
};
exports.getRecentActivity = getRecentActivity;
const getContactSubmissions = async (req, res) => {
    try {
        const { page, limit, skip } = (0, adminBaseController_1.getPaginationParams)(req);
        const { status, category, search } = req.query;
        const query = {};
        if (status)
            query.status = status;
        if (category)
            query.category = category;
        if (search) {
            const safeSearch = (0, stringUtils_1.escapeRegExp)(search);
            query.$or = [
                { name: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } },
                { message: { $regex: safeSearch, $options: 'i' } },
                { subject: { $regex: safeSearch, $options: 'i' } }
            ];
        }
        const [submissions, total] = await (0, AdminDashboardService_1.getContactSubmissionsPaginated)(query, skip, limit);
        (0, adminBaseController_1.sendPaginatedResponse)(res, submissions, total, page, limit);
    }
    catch (error) {
        sendDashboardError(req, res, error);
    }
};
exports.getContactSubmissions = getContactSubmissions;
const updateContactSubmissionStatus = async (req, res) => {
    try {
        const id = (0, requestParams_1.getSingleParam)(req, res, 'id', { error: 'Invalid submission id' });
        if (!id)
            return;
        const { status } = req.body;
        if (!['new', 'read', 'replied'].includes(status)) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Invalid status', 400);
        }
        const submission = await (0, AdminDashboardService_1.updateContactSubmissionById)(id, status);
        if (!submission) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Submission not found', 404);
        }
        (0, adminBaseController_1.sendSuccessResponse)(res, submission, 'Status updated successfully');
    }
    catch (error) {
        sendDashboardError(req, res, error);
    }
};
exports.updateContactSubmissionStatus = updateContactSubmissionStatus;
const getRateLimitMetrics = async (req, res) => {
    try {
        const keys = await (0, redisCache_1.scanKeysByPattern)("rl:*", { maxKeys: 5000 });
        const data = await Promise.all(keys.map(async (k) => ({ key: k, count: await redis_1.redis.get(k) })));
        (0, adminBaseController_1.sendSuccessResponse)(res, data);
    }
    catch {
        (0, adminBaseController_1.sendSuccessResponse)(res, []);
    }
};
exports.getRateLimitMetrics = getRateLimitMetrics;
const getLocationAnalytics = async (req, res) => {
    try {
        const data = await (0, AdminDashboardService_1.adminGetLocationAnalyticsData)(req.query);
        (0, adminBaseController_1.sendSuccessResponse)(res, data);
    }
    catch (error) {
        sendDashboardError(req, res, error);
    }
};
exports.getLocationAnalytics = getLocationAnalytics;
//# sourceMappingURL=adminDashboardController.js.map