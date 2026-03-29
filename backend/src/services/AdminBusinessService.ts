import Business from '../models/Business';
import { GOVERNANCE, MS_IN_DAY } from '../config/constants';
import { publishedBusinessStatusQuery } from '../utils/businessStatus';
import { BUSINESS_STATUS } from '../../../shared/enums/businessStatus';

/**
 * Service for advanced admin-only business management and metrics.
 */
export const getBusinessOverview = async () => {
    const thirtyDaysFromNow = new Date(Date.now() + GOVERNANCE.BUSINESS.AUTO_EXPIRE_CHECK_DAYS * MS_IN_DAY);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [
        live,
        pending,
        suspended,
        rejected,
        deleted,
        total,
        expiringSoon,
        timeline,
        topCities,
    ] = await Promise.all([
        Business.countDocuments({ status: BUSINESS_STATUS.LIVE }),
        Business.countDocuments({ status: BUSINESS_STATUS.PENDING }),
        Business.countDocuments({ status: BUSINESS_STATUS.SUSPENDED }),
        Business.countDocuments({ status: BUSINESS_STATUS.REJECTED }),
        Business.countDocuments({ isDeleted: true }).setOptions({ withDeleted: true }),
        Business.countDocuments({}).setOptions({ withDeleted: true }),
        Business.countDocuments({
            status: publishedBusinessStatusQuery,
            expiresAt: { $lte: thirtyDaysFromNow, $gte: new Date() },
            isDeleted: false,
        }),
        Business.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo }, isDeleted: { $ne: true } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]),
        Business.aggregate([
            { $match: { isDeleted: { $ne: true }, 'location.city': { $exists: true, $ne: '' } } },
            { $group: { _id: '$location.city', count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $limit: 5 },
            { $project: { _id: 0, city: '$_id', count: 1 } },
        ]),
    ]);

    return {
        total,
        pending,
        live,
        suspended,
        rejected,
        deleted,
        expiringSoon,
        analytics: {
            timeline,
            topCities,
        },
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
        const ownerRef = user._id || user.id
            ? {
                id: String(user.id || user._id),
                _id: String(user._id || user.id),
                name: ownerName,
                email: typeof user.email === 'string' ? user.email : undefined,
                mobile: typeof user.mobile === 'string' ? user.mobile : undefined,
            }
            : b.userId;
        const ownerId = user._id || user.id || b.userId;
        return {
            ...b,
            businessName: b.name,
            ownerName,
            businessPhone: b.mobile,
            businessEmail: b.email,
            sellerId: ownerRef,
            userId: ownerId,
            ownerId,
        };
    });

export const getBusinessAccountsQuery = (status?: string) => {
    const adminQuery: Record<string, any> = {};
    const normalizedStatus = status === 'approved' || status === 'active'
        ? BUSINESS_STATUS.LIVE
        : status;

    if (normalizedStatus && normalizedStatus !== 'all') {
        if (normalizedStatus === 'expiring') {
            const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            adminQuery.status = publishedBusinessStatusQuery;
            adminQuery.expiresAt = { $lte: sevenDaysFromNow, $gte: new Date() };
        } else if (normalizedStatus === BUSINESS_STATUS.DELETED) {
            adminQuery.isDeleted = true;
        } else {
            adminQuery.status = normalizedStatus;
        }
    }

    return adminQuery;
};
