import logger from '../utils/logger';
import AdminMetrics from '../models/AdminMetrics';
import User from '../models/User';
import Business from '../models/Business';
import { USER_STATUS } from '../../../shared/enums/userStatus';
import { BUSINESS_STATUS } from '../../../shared/enums/businessStatus';

export const runAdminMetricsJob = async () => {
    logger.info('Starting AdminMetrics cron job...');
    try {
        const startOfToday = new Date();
        startOfToday.setUTCHours(0, 0, 0, 0);

        const startOfWeek = new Date(startOfToday);
        startOfWeek.setUTCDate(startOfToday.getUTCDate() - 7);

        // 1. PRECOMPUTE USERS OVERVIEW
        const totalUsers = await User.countDocuments({ status: { $ne: USER_STATUS.DELETED } });
        const activeUsers = await User.countDocuments({ status: USER_STATUS.ACTIVE });
        const unverifiedUsers = await User.countDocuments({ isVerified: false, status: { $ne: USER_STATUS.DELETED } });
        const newUsersToday = await User.countDocuments({
            status: { $ne: USER_STATUS.DELETED },
            createdAt: { $gte: startOfToday }
        });
        const newUsersThisWeek = await User.countDocuments({
            status: { $ne: USER_STATUS.DELETED },
            createdAt: { $gte: startOfWeek }
        });
        const businessUsers = await User.countDocuments({ role: 'business', status: { $ne: USER_STATUS.DELETED } });

        const usersPayload = {
            totalUsers,
            activeUsers,
            unverifiedUsers,
            newUsersToday,
            newUsersThisWeek,
            businessUsers,
        };

        await AdminMetrics.create({
            metricModule: 'USERS_OVERVIEW',
            aggregationDate: new Date(),
            payload: usersPayload
        });

        // 2. PRECOMPUTE BUSINESS OVERVIEW
        const totalBusinesses = await Business.countDocuments({ isDeleted: false });
        const activeBusinesses = await Business.countDocuments({ status: BUSINESS_STATUS.LIVE, isDeleted: false });
        const pendingBusinesses = await Business.countDocuments({ status: BUSINESS_STATUS.PENDING, isDeleted: false });
        const suspendedBusinesses = await Business.countDocuments({ status: BUSINESS_STATUS.SUSPENDED, isDeleted: false });

        const newBusinessesToday = await Business.countDocuments({
            isDeleted: false,
            createdAt: { $gte: startOfToday }
        });
        const newBusinessesThisWeek = await Business.countDocuments({
            isDeleted: false,
            createdAt: { $gte: startOfWeek }
        });

        // Heavy Aggregation: Top Cities
        const topCitiesAgg = await Business.aggregate([
            { $match: { isDeleted: false, status: BUSINESS_STATUS.LIVE } },
            { $group: { _id: "$location.city", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const topCities = topCitiesAgg.reduce<Record<string, number>>((acc, curr) => {
            if (curr._id) acc[curr._id as string] = curr.count as number;
            return acc;
        }, {});

        const rejectedBusinesses = await Business.countDocuments({ status: BUSINESS_STATUS.REJECTED, isDeleted: false });

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

        await AdminMetrics.create({
            metricModule: 'BUSINESS_OVERVIEW',
            aggregationDate: new Date(),
            payload: businessPayload
        });

        logger.info('AdminMetrics cron job completed successfully');
    } catch (error) {
        logger.error('Error running AdminMetrics cron job:', error);
    }
};
