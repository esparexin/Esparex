import User from '../models/User';
import Ad from '../models/Ad';

interface CountResult { count: number }
interface MonthlyCountResult { _id: { month: number; year: number }; count: number }
interface AdsByLocationResult { _id: string; adsCount: number }

interface OverviewFacetResult {
    totalAds: CountResult[];
    activeAds: CountResult[];
    pendingAds: CountResult[];
    totalServices: CountResult[];
    activeServices: CountResult[];
    pendingServices: CountResult[];
    rejectedServices: CountResult[];
    totalSpareParts: CountResult[];
    activeSpareParts: CountResult[];
    pendingSpareParts: CountResult[];
}
interface CardFacetResult {
    live: CountResult[];
    pending: CountResult[];
}
interface RevenueAggResult { _id: null; total: number }

import CatalogModel from '../models/Model';
import Report from '../models/Report';
import Business from '../models/Business';
import RevenueAnalytics from '../models/RevenueAnalytics';
import ContactSubmission from '../models/ContactSubmission';
import Location from '../models/Location';
import LocationAnalytics from '../models/LocationAnalytics';
import AdminLog from '../models/AdminLog';
import { AD_STATUS } from '@shared/enums/adStatus';
import { LISTING_TYPE } from '@shared/enums/listingType';
import { BUSINESS_STATUS } from '@shared/enums/businessStatus';
import { CATALOG_STATUS } from '@shared/enums/catalogStatus';
import { REPORT_STATUS } from '@shared/enums/reportStatus';
import { USER_STATUS } from '@shared/enums/userStatus';

export const getDashboardOverviewStats = async (publicAdFilter: Record<string, unknown>) => {
    const [
        totalUsers, unifiedStats,
        pendingModels, openReports, pendingBusinesses, totalRevenueAgg
    ] = await Promise.all([
        User.countDocuments(),
        Ad.aggregate<OverviewFacetResult>([
            {
                $facet: {
                    totalAds:        [{ $match: { listingType: LISTING_TYPE.AD } }, { $count: "count" }],
                    activeAds:       [{ $match: { listingType: LISTING_TYPE.AD,      ...publicAdFilter } }, { $count: "count" }],
                    pendingAds:      [{ $match: { listingType: LISTING_TYPE.AD,      status: AD_STATUS.PENDING } }, { $count: "count" }],
                    totalServices:    [{ $match: { listingType: LISTING_TYPE.SERVICE } }, { $count: "count" }],
                    activeServices:   [{ $match: { listingType: LISTING_TYPE.SERVICE, ...publicAdFilter } }, { $count: "count" }],
                    pendingServices:  [{ $match: { listingType: LISTING_TYPE.SERVICE, status: AD_STATUS.PENDING } }, { $count: "count" }],
                    rejectedServices: [{ $match: { listingType: LISTING_TYPE.SERVICE, status: AD_STATUS.REJECTED } }, { $count: "count" }],
                    totalSpareParts:  [{ $match: { listingType: LISTING_TYPE.SPARE_PART } }, { $count: "count" }],
                    activeSpareParts: [{ $match: { listingType: LISTING_TYPE.SPARE_PART, ...publicAdFilter } }, { $count: "count" }],
                    pendingSpareParts:[{ $match: { listingType: LISTING_TYPE.SPARE_PART, status: AD_STATUS.PENDING } }, { $count: "count" }]
                }
            }
        ]),
        CatalogModel.countDocuments({ status: CATALOG_STATUS.PENDING }),
        Report.countDocuments({ status: REPORT_STATUS.OPEN }),
        Business.countDocuments({ status: BUSINESS_STATUS.PENDING }),
        RevenueAnalytics.aggregate<RevenueAggResult>([{ $group: { _id: null, total: { $sum: "$totalRevenue" } } }])
    ]);

    return { totalUsers, unifiedStats, pendingModels, openReports, pendingBusinesses, totalRevenueAgg };
};

export const getDashboardCardStats = async (publicAdFilter: Record<string, unknown>) => {
    const [
        totalUsers, adStats,
        totalReports,
        totalBusinesses,
        totalRevenueAgg
    ] = await Promise.all([
        User.countDocuments(),
        Ad.aggregate<CardFacetResult>([
            {
                $facet: {
                    live:    [{ $match: { listingType: LISTING_TYPE.AD, ...publicAdFilter } }, { $count: "count" }],
                    pending: [{ $match: { listingType: LISTING_TYPE.AD, status: AD_STATUS.PENDING } }, { $count: "count" }]
                }
            }
        ]),
        Report.countDocuments({ status: { $in: [REPORT_STATUS.OPEN, REPORT_STATUS.PENDING] } }),
        Business.countDocuments({ isDeleted: { $ne: true } }),
        RevenueAnalytics.aggregate<RevenueAggResult>([{ $group: { _id: null, total: { $sum: "$totalRevenue" } } }])
    ]);

    return { totalUsers, adStats, totalReports, totalBusinesses, totalRevenueAgg };
};

export const getRecentAdminLogs = async (limit: number) => {
    return AdminLog.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('adminId', 'firstName lastName email');
};

export const getContactSubmissionsPaginated = async (
    query: Record<string, unknown>,
    skip: number,
    limit: number
) => {
    return Promise.all([
        ContactSubmission.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
        ContactSubmission.countDocuments(query),
    ]);
};

export const updateContactSubmissionById = async (id: string, status: string) => {
    // eslint-disable-next-line esparex/no-status-mutation-outside-status-mutation-service
    return ContactSubmission.findByIdAndUpdate(id, { status }, { new: true });
};

// ─── Location Analytics ───────────────────────────────────────────────────────

type ScopedQueryBuilder = (extra?: Record<string, unknown>) => Record<string, unknown>;

export const getLocationAnalyticsRawData = async (params: {
    sixMonthsAgo: Date;
    buildScopedLocationQuery: ScopedQueryBuilder;
    buildScopedAdQuery: ScopedQueryBuilder;
    buildScopedUserQuery: ScopedQueryBuilder;
    hotZoneQuery: Record<string, unknown>;
}) => {
    const {
        sixMonthsAgo,
        buildScopedLocationQuery,
        buildScopedAdQuery,
        buildScopedUserQuery,
        hotZoneQuery,
    } = params;

    const [
        totalLocations,
        totalAds,
        totalUsers,
        adsByLocationAgg,
        monthlyAds,
        monthlyUsers,
        monthlyLocs,
        topHotZonesRaw
    ] = await Promise.all([
        Location.countDocuments(buildScopedLocationQuery()),
        Ad.countDocuments(buildScopedAdQuery({ status: AD_STATUS.LIVE })),
        User.countDocuments(buildScopedUserQuery({ status: { $in: [USER_STATUS.LIVE, 'active'] } })),
        Ad.aggregate<AdsByLocationResult>([
            {
                $match: {
                    ...buildScopedAdQuery({ status: AD_STATUS.LIVE }),
                    'location.locationId': { $exists: true, $ne: null },
                }
            },
            { $group: { _id: '$location.locationId', adsCount: { $sum: 1 } } },
            { $sort: { adsCount: -1 } },
            { $limit: 250 }
        ]),
        Ad.aggregate<MonthlyCountResult>([
            { $match: buildScopedAdQuery({ createdAt: { $gte: sixMonthsAgo } }) },
            { $group: { _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } }, count: { $sum: 1 } } }
        ]),
        User.aggregate<MonthlyCountResult>([
            { $match: buildScopedUserQuery({ createdAt: { $gte: sixMonthsAgo } }) },
            { $group: { _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } }, count: { $sum: 1 } } }
        ]),
        Location.aggregate<MonthlyCountResult>([
            { $match: buildScopedLocationQuery({ createdAt: { $gte: sixMonthsAgo } }) },
            { $group: { _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } }, count: { $sum: 1 } } }
        ]),
        LocationAnalytics.find(hotZoneQuery)
            .select('locationId popularityScore searchCount adsCount')
            .sort({ popularityScore: -1, searchCount: -1 })
            .limit(10)
            .lean()
    ]);

    return { totalLocations, totalAds, totalUsers, adsByLocationAgg, monthlyAds, monthlyUsers, monthlyLocs, topHotZonesRaw };
};

export const getHotZoneLocations = async (locationIds: string[]) => {
    if (locationIds.length === 0) return [];
    return Location.find({ _id: { $in: locationIds } })
        .select('_id name country level parentId path')
        .lean();
};

export const getAnalyticsLocations = async (locationIds: string[]) => {
    if (locationIds.length === 0) return [];
    return Location.find({ _id: { $in: locationIds } })
        .select('_id name country level parentId path')
        .lean();
};
