/**
 * Admin Dashboard Controller
 * Handles dashboard statistics, analytics, contact submissions, and moderation data
 * Extracted from adminSystemController.ts
 */

import { Request, Response } from 'express';
import { sendSuccessResponse, getPaginationParams, sendPaginatedResponse } from '../adminBaseController';
import { sendErrorResponse } from '../../../utils/errorResponse';
import { getSingleParam } from '../../../utils/requestParams';
import { escapeRegExp } from '../../../utils/stringUtils';
import { GOVERNANCE, MS_IN_DAY } from '../../../config/constants';

import User from '../../../models/User';
import Ad from '../../../models/Ad';
import Model from '../../../models/Model';
import Report from '../../../models/Report';
import Business from '../../../models/Business';
import RevenueAnalytics from '../../../models/RevenueAnalytics';
import ContactSubmission from '../../../models/ContactSubmission';
import Location from '../../../models/Location';
import LocationAnalytics from '../../../models/LocationAnalytics';
import AdminLog from '../../../models/AdminLog';
import { redis } from '../../../lib/redis';
import { scanKeysByPattern } from '../../../utils/redisCache';
import { AD_STATUS } from '../../../../../shared/enums/adStatus';
import { LISTING_TYPE } from '../../../../../shared/enums/listingType';
import { BUSINESS_STATUS } from '../../../../../shared/enums/businessStatus';
import { CATALOG_STATUS } from '../../../../../shared/enums/catalogStatus';
import { REPORT_STATUS } from '../../../../../shared/enums/reportStatus';
import { USER_STATUS } from '../../../../../shared/enums/userStatus';
import { buildPublicAdFilter } from '../../../utils/FeedVisibilityGuard';

import * as adminAnalyticsController from '../adminAnalyticsController';

const sendDashboardError = (req: Request, res: Response, error: unknown) => {
    const message = error instanceof Error ? error.message : 'Dashboard operation failed';
    sendErrorResponse(req, res, 500, message);
};

/**
 * Get dashboard overview statistics
 */
export const getStats = async (req: Request, res: Response) => {
    try {
        // publicAdFilter mirrors exactly what users see on the homepage:
        // status=live + not expired + not deleted + not moderation-hidden.
        // This is the SSOT from FeedVisibilityGuard — must not be inlined here.
        const publicAdFilter = buildPublicAdFilter();

        const [
            totalUsers, unifiedStats,
            pendingModels, openReports, pendingBusinesses, totalRevenueAgg
        ] = await Promise.all([
            User.countDocuments(),
            Ad.aggregate([
                {
                    $facet: {
                        totalAds:        [{ $match: { listingType: LISTING_TYPE.AD } }, { $count: "count" }],
                        activeAds:       [{ $match: { listingType: LISTING_TYPE.AD,      ...publicAdFilter } }, { $count: "count" }],
                        pendingAds:      [{ $match: { listingType: LISTING_TYPE.AD,      status: AD_STATUS.PENDING } }, { $count: "count" }],
                        totalServices:   [{ $match: { listingType: LISTING_TYPE.SERVICE } }, { $count: "count" }],
                        activeServices:  [{ $match: { listingType: LISTING_TYPE.SERVICE, ...publicAdFilter } }, { $count: "count" }],
                        pendingServices: [{ $match: { listingType: LISTING_TYPE.SERVICE, status: AD_STATUS.PENDING } }, { $count: "count" }],
                        rejectedServices:[{ $match: { listingType: LISTING_TYPE.SERVICE, status: AD_STATUS.REJECTED } }, { $count: "count" }]
                    }
                }
            ]),
            Model.countDocuments({ status: CATALOG_STATUS.PENDING }),
            Report.countDocuments({ status: REPORT_STATUS.OPEN }),
            Business.countDocuments({ status: BUSINESS_STATUS.PENDING }),
            RevenueAnalytics.aggregate([{ $group: { _id: null, total: { $sum: "$totalRevenue" } } }])
        ]);

        const stats = unifiedStats[0];
        const totalAds = stats.totalAds[0]?.count || 0;
        const activeAds = stats.activeAds[0]?.count || 0;
        const pendingAds = stats.pendingAds[0]?.count || 0;

        const totalServices = stats.totalServices[0]?.count || 0;
        const activeServices = stats.activeServices[0]?.count || 0;
        const pendingServices = stats.pendingServices[0]?.count || 0;
        const rejectedServices = stats.rejectedServices[0]?.count || 0;

        const totalRevenue = totalRevenueAgg[0]?.total || 0;
        sendSuccessResponse(res, {
            totalUsers,
            totalAds,
            activeAds,
            pendingAds,
            totalServices,
            activeServices,
            pendingServices,
            rejectedServices,
            notifications: {
                pendingModels,
                reportedAds: openReports,
                pendingBusinesses: pendingBusinesses,
                pendingAds: pendingAds
            },
            revenue: totalRevenue
        });
    } catch (error: unknown) {
        sendDashboardError(req, res, error);
    }
};

/**
 * Compatibility endpoint for dashboard cards.
 * GET /api/v1/admin/dashboard/stats
 */
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // publicAdFilter: same visibility rules the homepage feed uses.
        // live = status:live AND not expired AND not deleted AND not moderation-hidden.
        const publicAdFilter = buildPublicAdFilter();

        const [
            totalUsers, adStats,
            totalReports,
            totalBusinesses,
            totalRevenueAgg
        ] = await Promise.all([
            User.countDocuments(),
            Ad.aggregate([
                {
                    $facet: {
                        live:    [{ $match: { listingType: LISTING_TYPE.AD, ...publicAdFilter } }, { $count: "count" }],
                        pending: [{ $match: { listingType: LISTING_TYPE.AD, status: AD_STATUS.PENDING } }, { $count: "count" }]
                    }
                }
            ]),
            Report.countDocuments({ status: { $in: [REPORT_STATUS.OPEN, REPORT_STATUS.PENDING] } }),
            Business.countDocuments({ isDeleted: { $ne: true } }),
            RevenueAnalytics.aggregate([{ $group: { _id: null, total: { $sum: "$totalRevenue" } } }])
        ]);

        const activeAds = adStats[0].live[0]?.count || 0;
        const pendingAds = adStats[0].pending[0]?.count || 0;

        const revenue = totalRevenueAgg[0]?.total || 0;
        sendSuccessResponse(res, {
            totalUsers,
            activeAds,
            pendingAds,
            totalReports,
            totalBusinesses,
            revenue
        });
    } catch (error: unknown) {
        sendDashboardError(req, res, error);
    }
};


/**
 * Get time-series analytics data
 */
export const getAnalytics = async (req: Request, res: Response) => {
    return adminAnalyticsController.getTimeSeriesAnalytics(req, res);
};

/**
 * Get recent admin activity log
 */
export const getRecentActivity = async (req: Request, res: Response) => {
    try {
        const logs = await AdminLog.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('adminId', 'firstName lastName email');

        const activity = logs.map(log => {
            const admin = (log.adminId || {}) as { firstName?: string; lastName?: string };
            return {
                title: log.action.replace(/_/g, ' '),
                description: `${admin?.firstName || 'Admin'} ${admin?.lastName || ''} - ${log.targetType} ${log.targetId || ''}`,
                time: log.createdAt // Frontend will format relative time
            };
        });

        sendSuccessResponse(res, activity);
    } catch (error: unknown) {
        sendDashboardError(req, res, error);
    }
};

/**
 * Get contact form submissions
 */
export const getContactSubmissions = async (req: Request, res: Response) => {
    try {
        const { page, limit, skip } = getPaginationParams(req);
        const { status, category, search } = req.query;

        const query: Record<string, unknown> & { $or?: Array<Record<string, unknown>> } = {};
        if (status) query.status = status;
        if (category) query.category = category;
        if (search) {
            const safeSearch = escapeRegExp(search as string);
            query.$or = [
                { name: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } },
                { message: { $regex: safeSearch, $options: 'i' } },
                { subject: { $regex: safeSearch, $options: 'i' } }
            ];
        }

        const [submissions, total] = await Promise.all([
            ContactSubmission.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
            ContactSubmission.countDocuments(query)
        ]);
        sendPaginatedResponse(res, submissions, total, page, limit);
    } catch (error: unknown) {
        sendDashboardError(req, res, error);
    }
};

/**
 * Update contact submission status
 */
export const updateContactSubmissionStatus = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid submission id' });
        if (!id) return;
        const { status } = req.body;

        if (!['new', 'read', 'replied'].includes(status)) {
            return sendErrorResponse(req, res, 400, 'Invalid status');
        }

        const submission = await ContactSubmission.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!submission) {
            return sendErrorResponse(req, res, 404, 'Submission not found');
        }

        sendSuccessResponse(res, submission, 'Status updated successfully');
    } catch (error: unknown) {
        sendDashboardError(req, res, error);
    }
};

/**
 * Get rate limit metrics
 */
export const getRateLimitMetrics = async (req: Request, res: Response) => {
    try {
        const keys = await scanKeysByPattern("rl:*", { maxKeys: 5000 });
        const data = await Promise.all(keys.map(async (k: string) => ({ key: k, count: await redis.get(k) })));
        sendSuccessResponse(res, data);
    } catch {
        // If redis is mock, this might fail, return empty
        sendSuccessResponse(res, []);
    }
};

/**
 * Get location analytics
 */
export const getLocationAnalytics = async (req: Request, res: Response) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - GOVERNANCE.BUSINESS.AUTO_EXPIRE_CHECK_DAYS * MS_IN_DAY);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const cityFilter = typeof req.query.city === 'string' ? req.query.city.trim() : '';
        const districtFilter = typeof req.query.district === 'string' ? req.query.district.trim() : '';
        const stateFilter = typeof req.query.state === 'string' ? req.query.state.trim() : '';
        const countryFilter = typeof req.query.country === 'string' ? req.query.country.trim() : '';

        const locationScopeFilter: Record<string, unknown> = { isActive: true };
        if (cityFilter) {
            locationScopeFilter.city = new RegExp(`^${escapeRegExp(cityFilter)}$`, 'i');
        }
        if (districtFilter) {
            locationScopeFilter.district = new RegExp(`^${escapeRegExp(districtFilter)}$`, 'i');
        }
        if (stateFilter && stateFilter !== 'all') {
            locationScopeFilter.state = new RegExp(`^${escapeRegExp(stateFilter)}$`, 'i');
        }
        if (countryFilter && countryFilter !== 'all') {
            locationScopeFilter.country = new RegExp(`^${escapeRegExp(countryFilter)}$`, 'i');
        }

        const locationScopeIds =
            Object.keys(locationScopeFilter).length > 1
                ? await Location.find(locationScopeFilter).distinct('_id')
                : null;
        const hotZoneQuery: Record<string, unknown> = { isHotZone: true };
        if (Array.isArray(locationScopeIds)) {
            if (locationScopeIds.length === 0) {
                hotZoneQuery.locationId = { $in: [] };
            } else {
                hotZoneQuery.locationId = { $in: locationScopeIds };
            }
        }

        const [
            // 1. Core Counts & Trends
            totalLocations, oldLocations,
            totalAds, oldAds,
            totalUsers, oldUsers,

            // 2. Top Cities (Aggregated from Ads)
            topCitiesAgg,

            // 3. Ads by State (Regional Distribution)
            adsByStateAgg,

            // 4. Monthly Trends (Ads, Users, Locations)
            monthlyAds,
            monthlyUsers,
            monthlyLocs,
            topHotZonesRaw
        ] = await Promise.all([
            Location.countDocuments({ isActive: true }),
            Location.countDocuments({ isActive: true, createdAt: { $lt: thirtyDaysAgo } }),
            Ad.countDocuments({ status: AD_STATUS.LIVE }),
            Ad.countDocuments({ status: AD_STATUS.LIVE, createdAt: { $lt: thirtyDaysAgo } }),
            User.countDocuments({ status: USER_STATUS.ACTIVE }),
            User.countDocuments({ status: USER_STATUS.ACTIVE, createdAt: { $lt: thirtyDaysAgo } }),

            // Top Cities by Activity
            Ad.aggregate([
                { $match: { status: AD_STATUS.LIVE } },
                {
                    $group: {
                        _id: { city: "$location.city", state: "$location.state" },
                        ads: { $sum: 1 }
                    }
                },
                { $sort: { ads: -1 } },
                { $limit: 10 }
            ]),

            // Ads by Region
            Ad.aggregate([
                { $match: { status: AD_STATUS.LIVE, "location.state": { $exists: true, $ne: null } } },
                { $group: { _id: "$location.state", count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),

            // Monthly Ad Trends
            Ad.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo } } },
                {
                    $group: {
                        _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Monthly User Trends
            User.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo } } },
                {
                    $group: {
                        _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Monthly Location Additions
            Location.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo } } },
                {
                    $group: {
                        _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Location intelligence overview (hot zones/popularity)
            LocationAnalytics.find(hotZoneQuery)
                .select('locationId popularityScore searchCount adsCount')
                .sort({ popularityScore: -1, searchCount: -1 })
                .limit(10)
                .lean()
        ]);

        const hotZoneLocationIds = topHotZonesRaw.map((zone) => zone.locationId);
        const hotZoneLocations = hotZoneLocationIds.length > 0
            ? await Location.find({ _id: { $in: hotZoneLocationIds } })
                .select('_id name city district state country level')
                .lean()
            : [];
        const hotZoneLocationMap = new Map(
            hotZoneLocations.map((location) => [String(location._id), location])
        );
        const topHotZones = topHotZonesRaw.map((zone) => {
            const location = hotZoneLocationMap.get(String(zone.locationId));
            return {
                ...zone,
                location: location
                    ? {
                        id: String(location._id),
                        name: location.name,
                        city: location.city,
                        state: location.state,
                        country: location.country,
                        level: location.level
                    }
                    : undefined
            };
        });

        const getTrend = (current: number, old: number): "up" | "down" => {
            return current >= old ? 'up' : 'down';
        };

        const getChange = (current: number, old: number) => {
            if (old === 0) return current > 0 ? '+100%' : '0%';
            const diff = ((current - old) / old) * 100;
            return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
        };

        // Format Monthly Trends
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const trends = [];
        for (let i = 0; i < 6; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            const m = d.getMonth() + 1;
            const y = d.getFullYear();

            const ads = monthlyAds.find(a => a._id.month === m && a._id.year === y)?.count || 0;
            const users = monthlyUsers.find(u => u._id.month === m && u._id.year === y)?.count || 0;
            const locs = monthlyLocs.find(l => l._id.month === m && l._id.year === y)?.count || 0;

            trends.push({
                month: monthNames[m - 1],
                adsPosted: ads,
                activeUsers: users,
                newLocations: locs
            });
        }

        sendSuccessResponse(res, {
            // Top-level counts — matches LocationAnalyticsData frontend type
            totalLocations,
            totalAds,
            totalUsers,
            // Shaped to match frontend type: { _id, city, state, adsCount }
            topCities: topCitiesAgg.map(c => ({
                _id: `${c._id.city ?? ''}-${c._id.state ?? ''}`,
                city: c._id.city ?? '',
                state: c._id.state ?? '',
                adsCount: c.ads,
            })),
            // Shaped to match frontend type: { _id, count }
            adsByState: adsByStateAgg.map(s => ({
                _id: s._id ?? 'Unknown',
                count: s.count,
            })),
            // Shaped to match frontend type: { _id, city, state, popularityScore, isHotZone }
            hotZones: topHotZonesRaw.map(zone => {
                const location = hotZoneLocationMap.get(String(zone.locationId));
                return {
                    _id: String(zone.locationId),
                    city: location?.city ?? '',
                    state: location?.state ?? '',
                    popularityScore: zone.popularityScore ?? 0,
                    isHotZone: true,
                };
            }),
            // Shaped to match frontend type: { month, ads, users }
            monthlyTrends: trends.map(t => ({
                month: t.month,
                ads: t.adsPosted,
                users: t.activeUsers,
            })),
        });
    } catch (error) {
        sendDashboardError(req, res, error);
    }
};
