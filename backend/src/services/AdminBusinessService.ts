import Business from '../models/Business';
import AdminMetrics from '../models/AdminMetrics';
import { GOVERNANCE, MS_IN_DAY } from '../config/constants';
import { publishedBusinessStatusQuery } from '../utils/businessStatus';
import { BUSINESS_STATUS } from '../../../shared/enums/businessStatus';

/**
 * Service for advanced admin-only business management and metrics.
 */
export const getBusinessOverview = async () => {
    const cachedMetrics = await AdminMetrics.findOne({ metricModule: 'BUSINESS_OVERVIEW' })
        .sort({ aggregationDate: -1 })
        .lean();

    const thirtyDaysFromNow = new Date(Date.now() + GOVERNANCE.BUSINESS.AUTO_EXPIRE_CHECK_DAYS * MS_IN_DAY);
    const expiringSoon = await Business.countDocuments({
        status: publishedBusinessStatusQuery,
        expiresAt: { $lte: thirtyDaysFromNow, $gte: new Date() },
        isDeleted: false
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const timeline = await Business.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo }, isDeleted: { $ne: true } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const payload = cachedMetrics ? (cachedMetrics.payload as any) : {
        totalBusinesses: 0,
        activeBusinesses: 0,
        pendingBusinesses: 0,
        suspendedBusinesses: 0,
        newBusinessesToday: 0,
        newBusinessesThisWeek: 0,
        topCities: {}
    };

    const topCitiesMap = payload.topCities as Record<string, number>;
    const topCities = Object.entries(topCitiesMap || {})
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => (b.count as number) - (a.count as number))
        .slice(0, 5);

    return {
        total: payload.totalBusinesses || 0,
        pending: payload.pendingBusinesses || 0,
        live: payload.activeBusinesses || 0,
        expiringSoon,
        rejected: payload.rejectedBusinesses || 0,
        analytics: {
            timeline,
            topCities
        }
    };
};

export const transformBusinessDocs = (items: any[]): any[] =>
    items.map((doc) => {
        const b = typeof doc.toObject === 'function' ? doc.toObject() : doc;
        const user = (b.userId && typeof b.userId === 'object' ? b.userId : {});
        const ownerName = typeof user.name === 'string'
            ? user.name
            : (typeof user.firstName === 'string'
                ? `${user.firstName} ${typeof user.lastName === 'string' ? user.lastName : ''}`.trim()
                : 'Unknown');
        return {
            ...b,
            businessName: b.name,
            ownerName,
            businessPhone: b.mobile,
            businessEmail: b.email,
            ownerId: user._id || user.id
        };
    });

export const getBusinessAccountsQuery = (status?: string) => {
    const adminQuery: Record<string, any> = {};

    if (status && status !== 'all') {
        if (status === 'expiring') {
            const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            adminQuery.status = publishedBusinessStatusQuery;
            adminQuery.expiresAt = { $lte: sevenDaysFromNow, $gte: new Date() };
        } else {
            adminQuery.status = status;
        }
    }

    return adminQuery;
};
