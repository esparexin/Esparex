"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAdminMetricsJob = void 0;
const logger_1 = __importDefault(require("@core/utils/logger"));
const AdminMetrics_1 = __importDefault(require("@core/models/AdminMetrics"));
const User_1 = __importDefault(require("@core/models/User"));
const Business_1 = __importDefault(require("@core/models/Business"));
const userStatus_1 = require("@core/constants/enums/userStatus");
const businessStatus_1 = require("@core/constants/enums/businessStatus");
const runAdminMetricsJob = async () => {
    logger_1.default.info('Starting AdminMetrics cron job...');
    try {
        const startOfToday = new Date();
        startOfToday.setUTCHours(0, 0, 0, 0);
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setUTCDate(startOfToday.getUTCDate() - 7);
        // 1. PRECOMPUTE USERS OVERVIEW
        const totalUsers = await User_1.default.countDocuments({ status: { $ne: userStatus_1.USER_STATUS.DELETED } });
        const activeUsers = await User_1.default.countDocuments({ status: userStatus_1.USER_STATUS.LIVE });
        const unverifiedUsers = await User_1.default.countDocuments({ isVerified: false, status: { $ne: userStatus_1.USER_STATUS.DELETED } });
        const newUsersToday = await User_1.default.countDocuments({
            status: { $ne: userStatus_1.USER_STATUS.DELETED },
            createdAt: { $gte: startOfToday }
        });
        const newUsersThisWeek = await User_1.default.countDocuments({
            status: { $ne: userStatus_1.USER_STATUS.DELETED },
            createdAt: { $gte: startOfWeek }
        });
        const businessUsers = await User_1.default.countDocuments({ role: 'business', status: { $ne: userStatus_1.USER_STATUS.DELETED } });
        const usersPayload = {
            totalUsers,
            activeUsers,
            unverifiedUsers,
            newUsersToday,
            newUsersThisWeek,
            businessUsers,
        };
        await AdminMetrics_1.default.create({
            metricModule: 'USERS_OVERVIEW',
            aggregationDate: new Date(),
            payload: usersPayload
        });
        // 2. PRECOMPUTE BUSINESS OVERVIEW
        const totalBusinesses = await Business_1.default.countDocuments({ isDeleted: false });
        const activeBusinesses = await Business_1.default.countDocuments({ status: businessStatus_1.BUSINESS_STATUS.LIVE, isDeleted: false });
        const pendingBusinesses = await Business_1.default.countDocuments({ status: businessStatus_1.BUSINESS_STATUS.PENDING, isDeleted: false });
        const suspendedBusinesses = await Business_1.default.countDocuments({ status: businessStatus_1.BUSINESS_STATUS.SUSPENDED, isDeleted: false });
        const newBusinessesToday = await Business_1.default.countDocuments({
            isDeleted: false,
            createdAt: { $gte: startOfToday }
        });
        const newBusinessesThisWeek = await Business_1.default.countDocuments({
            isDeleted: false,
            createdAt: { $gte: startOfWeek }
        });
        // Heavy Aggregation: Top Cities
        const topCitiesAgg = await Business_1.default.aggregate([
            { $match: { isDeleted: false, status: businessStatus_1.BUSINESS_STATUS.LIVE } },
            { $group: { _id: "$location.city", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        const topCities = topCitiesAgg.reduce((acc, curr) => {
            if (curr._id)
                acc[curr._id] = curr.count;
            return acc;
        }, {});
        const rejectedBusinesses = await Business_1.default.countDocuments({ status: businessStatus_1.BUSINESS_STATUS.REJECTED, isDeleted: false });
        const businessPayload = {
            totalBusinesses,
            activeBusinesses,
            pendingBusinesses,
            rejectedBusinesses,
            suspendedBusinesses,
            newBusinessesToday,
            newBusinessesThisWeek,
            topCities
        };
        await AdminMetrics_1.default.create({
            metricModule: 'BUSINESS_OVERVIEW',
            aggregationDate: new Date(),
            payload: businessPayload
        });
        logger_1.default.info('AdminMetrics cron job completed successfully');
    }
    catch (error) {
        logger_1.default.error('Error running AdminMetrics cron job:', error);
    }
};
exports.runAdminMetricsJob = runAdminMetricsJob;
//# sourceMappingURL=adminMetrics.job.js.map