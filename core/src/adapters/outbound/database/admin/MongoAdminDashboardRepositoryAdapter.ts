import mongoose from 'mongoose';
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
import { LISTING_STATUS, LISTING_TYPE, BUSINESS_STATUS, CATALOG_STATUS, REPORT_STATUS, USER_STATUS } from '@esparex/contracts';
import { AdminDashboardRepositoryPort } from '../../../../domains/admin';
import Category from '../../../../models/Category';
import Brand from '../../../../models/Brand';
import SparePart from '../../../../models/SparePart';
import ServiceType from '../../../../models/ServiceType';
import ScreenSize from '../../../../models/ScreenSize';
import logger from '../../../../utils/logger';

const CATALOG_REQUEST_PENDING_STATUS = 'pending' as CatalogRequestStatusValue;
const CATALOG_REQUEST_RESOLVED_STATUSES: CatalogRequestStatusValue[] = ['approved', 'rejected', 'merged', 'resolved'];
const CATALOG_REQUEST_MERGED_STATUS = 'merged' as CatalogRequestStatusValue;

export class MongoAdminDashboardRepositoryAdapter implements AdminDashboardRepositoryPort {
    public async getCatalogHealthMetrics(): Promise<any> {
        const [counts, resolutionAgg] = await Promise.all([
            CatalogRequest.aggregate([{ $match: { status: { $in: [CATALOG_REQUEST_PENDING_STATUS] } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
            CatalogRequest.aggregate([
                { $match: { status: { $in: CATALOG_REQUEST_RESOLVED_STATUSES }, $or: [{ approvedAt: { $ne: null } }, { rejectedAt: { $ne: null } }] } },
                { $project: { resolutionTimeMs: { $subtract: [{ $ifNull: ['$approvedAt', '$rejectedAt'] }, '$createdAt'] } } },
                { $group: { _id: null, avgTimeMs: { $avg: '$resolutionTimeMs' } } }
            ]),
        ]);

        const findCount = (status: string) => counts.find((c: any) => c._id === status)?.count || 0;
        const pendingRequests = findCount(CATALOG_REQUEST_PENDING_STATUS);
        const mergedRequests = findCount(CATALOG_REQUEST_MERGED_STATUS);
        const avgTimeMs = resolutionAgg[0]?.avgTimeMs || 0;
        const averageResolutionHours = Number((avgTimeMs / (1000 * 60 * 60)).toFixed(1));

        return { pendingRequests, averageResolutionHours, mergedRequests };
    }

    public async getDashboardOverviewStats(publicAdFilter: any): Promise<any> {
        const [totalUsers, unifiedStats, pendingModels, openReports, pendingBusinesses, totalRevenueAgg, catalogHealth] = await Promise.all([
            User.countDocuments(),
            Ad.aggregate([
                {
                    $facet: {
                        totalAds: [{ $match: { listingType: LISTING_TYPE.AD, isDeleted: { $ne: true } } }, { $count: 'count' }],
                        activeAds: [{ $match: { listingType: LISTING_TYPE.AD, ...publicAdFilter } }, { $count: 'count' }],
                        pendingAds: [{ $match: { listingType: LISTING_TYPE.AD, status: LISTING_STATUS.PENDING, isDeleted: { $ne: true } } }, { $count: 'count' }],
                        totalServices: [{ $match: { listingType: LISTING_TYPE.SERVICE, isDeleted: { $ne: true } } }, { $count: 'count' }],
                        activeServices: [{ $match: { listingType: LISTING_TYPE.SERVICE, ...publicAdFilter } }, { $count: 'count' }],
                        pendingServices: [{ $match: { listingType: LISTING_TYPE.SERVICE, status: LISTING_STATUS.PENDING, isDeleted: { $ne: true } } }, { $count: 'count' }],
                        rejectedServices:[{ $match: { listingType: LISTING_TYPE.SERVICE, status: LISTING_STATUS.REJECTED, isDeleted: { $ne: true } } }, { $count: 'count' }],
                        totalSpareParts: [{ $match: { listingType: LISTING_TYPE.SPARE_PART, isDeleted: { $ne: true } } }, { $count: 'count' }],
                        activeSpareParts:[{ $match: { listingType: LISTING_TYPE.SPARE_PART, ...publicAdFilter } }, { $count: 'count' }],
                        pendingSpareParts:[{ $match: { listingType: LISTING_TYPE.SPARE_PART, status: LISTING_STATUS.PENDING, isDeleted: { $ne: true } } }, { $count: 'count' }]
                    }
                }
            ]),
            CatalogModel.countDocuments({ status: CATALOG_STATUS.PENDING }),
            Report.countDocuments({ status: REPORT_STATUS.OPEN }),
            Business.countDocuments({ status: BUSINESS_STATUS.PENDING }),
            RevenueAnalytics.aggregate([{ $group: { _id: null, total: { $sum: '$totalRevenue' } } }]),
            this.getCatalogHealthMetrics()
        ]);
        return { totalUsers, unifiedStats, pendingModels, openReports, pendingBusinesses, totalRevenueAgg, catalogHealth };
    }

    public async getDashboardCardStats(publicAdFilter: any): Promise<any> {
        const [totalUsers, adStats, totalReports, totalBusinesses, totalRevenueAgg, catalogHealth] = await Promise.all([
            User.countDocuments(),
            Ad.aggregate([
                {
                    $facet: {
                        live: [{ $match: { listingType: LISTING_TYPE.AD, ...publicAdFilter } }, { $count: 'count' }],
                        pending: [{ $match: { listingType: LISTING_TYPE.AD, status: LISTING_STATUS.PENDING } }, { $count: 'count' }]
                    }
                }
            ]),
            Report.countDocuments({ status: { $in: [REPORT_STATUS.OPEN, REPORT_STATUS.PENDING] } }),
            Business.countDocuments({ isDeleted: { $ne: true } }),
            RevenueAnalytics.aggregate([{ $group: { _id: null, total: { $sum: '$totalRevenue' } } }]),
            this.getCatalogHealthMetrics()
        ]);
        return { totalUsers, adStats, totalReports, totalBusinesses, totalRevenueAgg, catalogHealth };
    }

    public async getRecentAdminLogs(limit: number): Promise<any[]> {
        return AdminLog.find().sort({ createdAt: -1 }).limit(limit).populate('adminId', 'firstName lastName email').lean();
    }

    public async getContactSubmissionsPaginated(query: any, skip: number, limit: number): Promise<[any[], number]> {
        return Promise.all([
            ContactSubmission.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
            ContactSubmission.countDocuments(query),
        ]);
    }

    public async updateContactSubmissionById(id: string, status: string): Promise<any> {
        const safeId = typeof id === 'string' ? id : String(id);
        // eslint-disable-next-line esparex/no-status-mutation-outside-status-mutation-service
        return ContactSubmission.findByIdAndUpdate(safeId, { $set: { status: typeof status === 'string' ? status : String(status) } }, { new: true });
    }

    public async getLocationAnalyticsRawData(params: any): Promise<any> {
        const { sixMonthsAgo, buildScopedLocationQuery, buildScopedAdQuery, buildScopedUserQuery, hotZoneQuery } = params;
        const [totalLocations, totalAds, totalUsers, adsByLocationAgg, monthlyAds, monthlyUsers, monthlyLocs, topHotZonesRaw] = await Promise.all([
            Location.countDocuments(buildScopedLocationQuery()),
            Ad.countDocuments(buildScopedAdQuery({ status: LISTING_STATUS.LIVE })),
            User.countDocuments(buildScopedUserQuery({ status: USER_STATUS.LIVE })),
            Ad.aggregate([
                { $match: { ...buildScopedAdQuery({ status: LISTING_STATUS.LIVE }), 'location.locationId': { $exists: true, $ne: null } } },
                { $group: { _id: '$location.locationId', adsCount: { $sum: 1 } } },
                { $sort: { adsCount: -1 } },
                { $limit: 250 }
            ]),
            Ad.aggregate([
                { $match: buildScopedAdQuery({ createdAt: { $gte: sixMonthsAgo } }) },
                { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } }
            ]),
            User.aggregate([
                { $match: buildScopedUserQuery({ createdAt: { $gte: sixMonthsAgo } }) },
                { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } }
            ]),
            Location.aggregate([
                { $match: buildScopedLocationQuery({ createdAt: { $gte: sixMonthsAgo } }) },
                { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } }
            ]),
            LocationAnalytics.find(hotZoneQuery).select('locationId popularityScore searchCount adsCount').sort({ popularityScore: -1, searchCount: -1 }).limit(10).lean()
        ]);
        return { totalLocations, totalAds, totalUsers, adsByLocationAgg, monthlyAds, monthlyUsers, monthlyLocs, topHotZonesRaw };
    }

    public async getHotZoneLocations(locationIds: string[]): Promise<any[]> {
        if (locationIds.length === 0) return [];
        return Location.find({ _id: { $in: locationIds } }).select('_id name country level parentId path').lean();
    }

    public async getAnalyticsLocations(locationIds: string[]): Promise<any[]> {
        if (locationIds.length === 0) return [];
        return Location.find({ _id: { $in: locationIds } }).select('_id name country level parentId path').lean();
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
