import User from '../../../../models/User';
import Ad from '../../../../models/Ad';
import CatalogRequest, { CatalogRequestStatusValue } from '../../../../models/CatalogRequest';
import CatalogModel from '../../../../models/Model';
import Report from '../../../../models/Report';
import Business from '../../../../models/Business';
import RevenueAnalytics from '../../../../models/RevenueAnalytics';
import ContactSubmission from '../../../../models/ContactSubmission';
import Location from '../../../../models/Location';
import LocationAnalytics from '../../../../models/LocationAnalytics';
import AdminLog from '../../../../models/AdminLog';
import { LISTING_STATUS, LISTING_TYPE, BUSINESS_STATUS, CATALOG_STATUS, REPORT_STATUS, USER_STATUS, type CatalogHealthMetricsDTO } from '@esparex/contracts';
import {
    AdminDashboardRepositoryPort,
    type AdminLocationSummary,
    type AdminLogSummary,
    type ContactSubmissionDocument,
    type DashboardCardStatsRaw,
    type DashboardOverviewStatsRaw,
    type LocationAnalyticsParams,
    type LocationAnalyticsRawData,
    type UnifiedAdStatsFacet,
    type DashboardCardAdStatsFacet,
    type RevenueTotalAggItem,
} from '../../../../domains/admin';
import Category from '../../../../models/Category';
import Brand from '../../../../models/Brand';
import SparePart from '../../../../models/SparePart';
import ServiceType from '../../../../models/ServiceType';
import ScreenSize from '../../../../models/ScreenSize';
import logger from '../../../../utils/logger';

const CATALOG_REQUEST_PENDING_STATUS: CatalogRequestStatusValue = 'pending';
const CATALOG_REQUEST_RESOLVED_STATUSES: CatalogRequestStatusValue[] = ['approved', 'rejected', 'merged', 'resolved'];
const CATALOG_REQUEST_MERGED_STATUS: CatalogRequestStatusValue = 'merged';

export class MongoAdminDashboardRepositoryAdapter implements AdminDashboardRepositoryPort {
    public async getCatalogHealthMetrics(): Promise<CatalogHealthMetricsDTO> {
        const [counts, resolutionAgg] = await Promise.all([
            CatalogRequest.aggregate<{ _id: string; count: number }>([{ $match: { status: { $in: [CATALOG_REQUEST_PENDING_STATUS] } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
            CatalogRequest.aggregate<{ _id: null; avgTimeMs: number }>([
                { $match: { status: { $in: CATALOG_REQUEST_RESOLVED_STATUSES }, $or: [{ approvedAt: { $ne: null } }, { rejectedAt: { $ne: null } }] } },
                { $project: { resolutionTimeMs: { $subtract: [{ $ifNull: ['$approvedAt', '$rejectedAt'] }, '$createdAt'] } } },
                { $group: { _id: null, avgTimeMs: { $avg: '$resolutionTimeMs' } } }
            ]),
        ]);

        const findCount = (status: string) => counts.find((c) => c._id === status)?.count || 0;
        const pendingRequests = findCount(CATALOG_REQUEST_PENDING_STATUS);
        const mergedRequests = findCount(CATALOG_REQUEST_MERGED_STATUS);
        const avgTimeMs = resolutionAgg[0]?.avgTimeMs || 0;
        const averageResolutionHours = Number((avgTimeMs / (1000 * 60 * 60)).toFixed(1));

        return { pendingRequests, averageResolutionHours, mergedRequests };
    }

    public async getDashboardOverviewStats(publicAdFilter: Record<string, unknown>): Promise<DashboardOverviewStatsRaw> {
        const [totalUsers, unifiedStats, pendingModels, openReports, pendingBusinesses, totalRevenueAgg, catalogHealth] = await Promise.all([
            User.countDocuments({ isDeleted: { $ne: true } }),
            Ad.aggregate<UnifiedAdStatsFacet>([
                {
                    $facet: {
                        totalAds: [{ $match: { listingType: LISTING_TYPE.AD, isDeleted: { $ne: true } } }, { $count: 'count' }],
                        activeAds: [{ $match: { listingType: LISTING_TYPE.AD, ...publicAdFilter } }, { $count: 'count' }],
                        pendingAds: [{ $match: { listingType: LISTING_TYPE.AD, status: LISTING_STATUS.PENDING, isDeleted: { $ne: true } } }, { $count: 'count' }],
                        totalServices: [{ $match: { listingType: LISTING_TYPE.SERVICE, isDeleted: { $ne: true } } }, { $count: 'count' }],
                        activeServices: [{ $match: { listingType: LISTING_TYPE.SERVICE, ...publicAdFilter } }, { $count: 'count' }],
                        pendingServices: [{ $match: { listingType: LISTING_TYPE.SERVICE, status: LISTING_STATUS.PENDING, isDeleted: { $ne: true } } }, { $count: 'count' }],
                        rejectedServices: [{ $match: { listingType: LISTING_TYPE.SERVICE, status: LISTING_STATUS.REJECTED, isDeleted: { $ne: true } } }, { $count: 'count' }],
                        totalSpareParts: [{ $match: { listingType: LISTING_TYPE.SPARE_PART, isDeleted: { $ne: true } } }, { $count: 'count' }],
                        activeSpareParts: [{ $match: { listingType: LISTING_TYPE.SPARE_PART, ...publicAdFilter } }, { $count: 'count' }],
                        pendingSpareParts: [{ $match: { listingType: LISTING_TYPE.SPARE_PART, status: LISTING_STATUS.PENDING, isDeleted: { $ne: true } } }, { $count: 'count' }]
                    }
                }
            ]),
            CatalogModel.countDocuments({ status: CATALOG_STATUS.PENDING, isDeleted: { $ne: true } }),
            Report.countDocuments({ status: REPORT_STATUS.OPEN, isDeleted: { $ne: true } }),
            Business.countDocuments({ status: BUSINESS_STATUS.PENDING, isDeleted: { $ne: true } }),
            RevenueAnalytics.aggregate<RevenueTotalAggItem>([{ $group: { _id: null, total: { $sum: '$totalRevenue' } } }]),
            this.getCatalogHealthMetrics()
        ]);
        return { totalUsers, unifiedStats: unifiedStats as [UnifiedAdStatsFacet], pendingModels, openReports, pendingBusinesses, totalRevenueAgg, catalogHealth };
    }

    public async getDashboardCardStats(publicAdFilter: Record<string, unknown>): Promise<DashboardCardStatsRaw> {
        const [totalUsers, adStats, totalReports, totalBusinesses, totalRevenueAgg, catalogHealth] = await Promise.all([
            User.countDocuments({ isDeleted: { $ne: true } }),
            Ad.aggregate<DashboardCardAdStatsFacet>([
                {
                    $facet: {
                        live: [{ $match: { listingType: LISTING_TYPE.AD, ...publicAdFilter } }, { $count: 'count' }],
                        pending: [{ $match: { listingType: LISTING_TYPE.AD, status: LISTING_STATUS.PENDING, isDeleted: { $ne: true } } }, { $count: 'count' }]
                    }
                }
            ]),
            Report.countDocuments({ status: { $in: [REPORT_STATUS.OPEN, REPORT_STATUS.PENDING] }, isDeleted: { $ne: true } }),
            Business.countDocuments({ isDeleted: { $ne: true } }),
            RevenueAnalytics.aggregate<RevenueTotalAggItem>([{ $group: { _id: null, total: { $sum: '$totalRevenue' } } }]),
            this.getCatalogHealthMetrics()
        ]);
        return { totalUsers, adStats: adStats as [DashboardCardAdStatsFacet], totalReports, totalBusinesses, totalRevenueAgg, catalogHealth };
    }

    public async getRecentAdminLogs(limit: number): Promise<AdminLogSummary[]> {
        return (await AdminLog.find().sort({ createdAt: -1 }).limit(limit).populate('adminId', 'firstName lastName email').lean<AdminLogSummary[]>()) || [];
    }

    public async getContactSubmissionsPaginated(query: Record<string, unknown>, skip: number, limit: number): Promise<[ContactSubmissionDocument[], number]> {
        return Promise.all([
            ContactSubmission.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).lean<ContactSubmissionDocument[]>(),
            ContactSubmission.countDocuments(query),
        ]);
    }

    public async updateContactSubmissionById(id: string, status: string): Promise<ContactSubmissionDocument | null> {
        const safeId = typeof id === 'string' ? id : String(id);
        // eslint-disable-next-line esparex/no-status-mutation-outside-status-mutation-service
        return await ContactSubmission.findByIdAndUpdate(safeId, { $set: { status: typeof status === 'string' ? status : String(status) } }, { new: true }).lean<ContactSubmissionDocument | null>();
    }

    public async getLocationAnalyticsRawData(params: LocationAnalyticsParams): Promise<LocationAnalyticsRawData> {
        const { sixMonthsAgo, buildScopedLocationQuery, buildScopedAdQuery, buildScopedUserQuery, hotZoneQuery } = params;
        const [totalLocations, totalAds, totalUsers, adsByLocationAgg, monthlyAds, monthlyUsers, monthlyLocs, topHotZonesRaw] = await Promise.all([
            Location.countDocuments(buildScopedLocationQuery()),
            Ad.countDocuments(buildScopedAdQuery({ status: LISTING_STATUS.LIVE })),
            User.countDocuments(buildScopedUserQuery({ status: USER_STATUS.LIVE })),
            Ad.aggregate<{ _id: unknown; adsCount: number }>([
                { $match: { ...buildScopedAdQuery({ status: LISTING_STATUS.LIVE }), 'location.locationId': { $exists: true, $ne: null } } },
                { $group: { _id: '$location.locationId', adsCount: { $sum: 1 } } },
                { $sort: { adsCount: -1 } },
                { $limit: 250 }
            ]),
            Ad.aggregate<{ _id: { month: number; year: number }; count: number }>([
                { $match: buildScopedAdQuery({ createdAt: { $gte: sixMonthsAgo } }) },
                { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } }
            ]),
            User.aggregate<{ _id: { month: number; year: number }; count: number }>([
                { $match: buildScopedUserQuery({ createdAt: { $gte: sixMonthsAgo } }) },
                { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } }
            ]),
            Location.aggregate<{ _id: { month: number; year: number }; count: number }>([
                { $match: buildScopedLocationQuery({ createdAt: { $gte: sixMonthsAgo } }) },
                { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } }
            ]),
            LocationAnalytics.find(hotZoneQuery).select('locationId popularityScore searchCount adsCount').sort({ popularityScore: -1, searchCount: -1 }).limit(10).lean<{ locationId: string; popularityScore: number; searchCount: number; adsCount: number }[]>()
        ]);
        return {
            totalLocations,
            totalAds,
            totalUsers,
            adsByLocationAgg: adsByLocationAgg || [],
            monthlyAds: monthlyAds || [],
            monthlyUsers: monthlyUsers || [],
            monthlyLocs: monthlyLocs || [],
            topHotZonesRaw: topHotZonesRaw || []
        };
    }

    public async getHotZoneLocations(locationIds: string[]): Promise<AdminLocationSummary[]> {
        if (locationIds.length === 0) return [];
        return (await Location.find({ _id: { $in: locationIds } }).select('_id name country level parentId path').lean<AdminLocationSummary[]>()) || [];
    }

    public async getAnalyticsLocations(locationIds: string[]): Promise<AdminLocationSummary[]> {
        if (locationIds.length === 0) return [];
        return (await Location.find({ _id: { $in: locationIds } }).select('_id name country level parentId path').lean<AdminLocationSummary[]>()) || [];
    }

    public async getCatalogEntityCounts(): Promise<Record<string, number>> {
        const nonDeletedFilter = { isDeleted: { $ne: true } };

        const countCollection = async (model: any, name: string): Promise<number> => {
            try {
                return await model.countDocuments(nonDeletedFilter).hint({ isDeleted: 1 }).exec();
            } catch (error) {
                logger.warn(`Failed to count ${name} using hint`, { error });
                return await model.countDocuments(nonDeletedFilter).exec();
            }
        };

        const [categories, brands, models, spareParts, serviceTypes, screenSizes] = await Promise.all([
            countCollection(Category, 'Category'),
            countCollection(Brand, 'Brand'),
            countCollection(CatalogModel, 'Model'),
            countCollection(SparePart, 'SparePart'),
            countCollection(ServiceType, 'ServiceType'),
            countCollection(ScreenSize, 'ScreenSize')
        ]);

        return { categories, brands, models, spareParts, serviceTypes, screenSizes };
    }
}
