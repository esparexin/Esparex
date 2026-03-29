/**
 * Admin Dashboard Controller
 * Handles dashboard statistics, analytics, contact submissions, and moderation data
 * Extracted from adminSystemController.ts
 */

import { Request, Response } from 'express';
import { sendSuccessResponse, getPaginationParams, sendPaginatedResponse, sendAdminError } from '../adminBaseController';
import { getSingleParam } from '../../../utils/requestParams';
import { escapeRegExp } from '../../../utils/stringUtils';

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

import {
    buildLocationSummary,
    loadHierarchyMapForLocations,
    normalizeStateLabel,
    resolveLocationScope,
} from '../../../utils/locationHierarchy';

import * as adminAnalyticsController from '../adminAnalyticsController';

const sendDashboardError = (req: Request, res: Response, error: unknown) => {
    sendAdminError(req, res, error);
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

        const totalSpareParts = stats.totalSpareParts[0]?.count || 0;
        const activeSpareParts = stats.activeSpareParts[0]?.count || 0;
        const pendingSpareParts = stats.pendingSpareParts[0]?.count || 0;

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
            return sendAdminError(req, res, 'Invalid status', 400);
        }

        const submission = await ContactSubmission.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!submission) {
            return sendAdminError(req, res, 'Submission not found', 404);
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
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const cityFilter = typeof req.query.city === 'string' ? req.query.city.trim() : '';
        const districtFilter = typeof req.query.district === 'string' ? req.query.district.trim() : '';
        const stateFilter = typeof req.query.state === 'string' ? req.query.state.trim() : '';
        const countryFilter = typeof req.query.country === 'string' ? req.query.country.trim() : '';
        const scope = await resolveLocationScope({
            city: cityFilter || undefined,
            district: districtFilter || undefined,
            state: stateFilter && stateFilter !== 'all' ? stateFilter : undefined,
            country: countryFilter && countryFilter !== 'all' ? countryFilter : undefined,
        });
        const locationScopeIds = scope.locationIds;

        const buildScopedLocationQuery = (extra: Record<string, unknown> = {}) => {
            if (locationScopeIds === null) {
                return { isActive: true, ...extra };
            }
            if (locationScopeIds.length === 0) {
                return { _id: { $in: [] }, ...extra };
            }
            return {
                isActive: true,
                ...extra,
                $or: [
                    { _id: { $in: locationScopeIds } },
                    { path: { $in: locationScopeIds } },
                ],
            };
        };

        const buildScopedAdQuery = (extra: Record<string, unknown> = {}) => {
            if (locationScopeIds === null) {
                return extra;
            }
            if (locationScopeIds.length === 0) {
                return { _id: { $in: [] }, ...extra };
            }
            return {
                ...extra,
                $or: [
                    { 'location.locationId': { $in: locationScopeIds } },
                    { locationPath: { $in: locationScopeIds } },
                ],
            };
        };

        const buildScopedUserQuery = (extra: Record<string, unknown> = {}) => {
            if (locationScopeIds === null) {
                return extra;
            }
            if (locationScopeIds.length === 0) {
                return { _id: { $in: [] }, ...extra };
            }

            const orQuery: Array<Record<string, unknown>> = [
                { locationId: { $in: locationScopeIds } },
                { 'location.locationId': { $in: locationScopeIds } },
            ];

            if (cityFilter) {
                orQuery.push({ 'location.city': new RegExp(`^${escapeRegExp(cityFilter)}$`, 'i') });
            }
            if (stateFilter && stateFilter !== 'all') {
                orQuery.push({ 'location.state': new RegExp(`^${escapeRegExp(stateFilter)}$`, 'i') });
            }

            return {
                ...extra,
                $or: orQuery,
            };
        };

        if (Array.isArray(locationScopeIds) && locationScopeIds.length === 0) {
            return sendSuccessResponse(res, {
                totalLocations: 0,
                totalAds: 0,
                totalUsers: 0,
                topCities: [],
                adsByState: [],
                hotZones: [],
                monthlyTrends: [],
            });
        }

        const hotZoneQuery: Record<string, unknown> = {
            isHotZone: true,
            ...(Array.isArray(locationScopeIds) ? { locationId: { $in: locationScopeIds } } : {}),
        };

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
            Ad.aggregate([
                {
                    $match: {
                        ...buildScopedAdQuery({ status: AD_STATUS.LIVE }),
                        'location.locationId': { $exists: true, $ne: null },
                    }
                },
                {
                    $group: {
                        _id: '$location.locationId',
                        adsCount: { $sum: 1 }
                    }
                },
                { $sort: { adsCount: -1 } },
                { $limit: 250 }
            ]),

            // Monthly Ad Trends
            Ad.aggregate([
                { $match: buildScopedAdQuery({ createdAt: { $gte: sixMonthsAgo } }) },
                {
                    $group: {
                        _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Monthly User Trends
            User.aggregate([
                { $match: buildScopedUserQuery({ createdAt: { $gte: sixMonthsAgo } }) },
                {
                    $group: {
                        _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Monthly Location Additions
            Location.aggregate([
                { $match: buildScopedLocationQuery({ createdAt: { $gte: sixMonthsAgo } }) },
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
                .select('_id name country level parentId path')
                .lean()
            : [];
        const hotZoneHierarchyMap = await loadHierarchyMapForLocations(hotZoneLocations);
        const hotZoneLocationMap = new Map(
            hotZoneLocations.map((location) => [String(location._id), location])
        );
        const hotZones = topHotZonesRaw.map((zone) => {
            const location = hotZoneLocationMap.get(String(zone.locationId));
            const summary = location ? buildLocationSummary(location as any, hotZoneHierarchyMap as any) : undefined;
            return {
                _id: String(zone._id),
                city: summary?.city ?? '',
                state: summary?.state ?? '',
                popularityScore: zone.popularityScore ?? 0,
                isHotZone: true,
            };
        });

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

        const adsByLocationIds = adsByLocationAgg
            .map((entry) => entry?._id)
            .filter((value): value is string => Boolean(value))
            .map((value) => String(value));
        const analyticsLocations = adsByLocationIds.length > 0
            ? await Location.find({ _id: { $in: adsByLocationIds } })
                .select('_id name country level parentId path')
                .lean()
            : [];
        const analyticsHierarchyMap = await loadHierarchyMapForLocations(analyticsLocations);
        const analyticsLocationMap = new Map(
            analyticsLocations.map((location) => [String(location._id), location])
        );

        const topCityMap = new Map<string, { _id: string; city: string; state: string; adsCount: number }>();
        const adsByStateMap = new Map<string, { _id: string; count: number }>();

        for (const entry of adsByLocationAgg) {
            const location = analyticsLocationMap.get(String(entry._id));
            if (!location) continue;

            const summary = buildLocationSummary(location, analyticsHierarchyMap);
            const count = typeof entry?.adsCount === 'number' ? entry.adsCount : Number(entry?.adsCount || 0);

            if (summary.city && summary.state && summary.level !== 'state' && summary.level !== 'country') {
                const cityKey = `${summary.city.toLowerCase()}::${summary.state.toLowerCase()}`;
                const existingCity = topCityMap.get(cityKey);
                if (existingCity) {
                    existingCity.adsCount += count;
                } else {
                    topCityMap.set(cityKey, {
                        _id: cityKey,
                        city: summary.city,
                        state: summary.state,
                        adsCount: count,
                    });
                }
            }

            const stateLabel = normalizeStateLabel(summary.state);
            const stateKey = stateLabel.toLowerCase();
            const existing = adsByStateMap.get(stateKey);
            if (existing) {
                existing.count += count;
                continue;
            }
            adsByStateMap.set(stateKey, { _id: stateLabel, count });
        }
        const topCities = Array.from(topCityMap.values())
            .sort((a, b) => b.adsCount - a.adsCount)
            .slice(0, 10);
        const adsByState = Array.from(adsByStateMap.values()).sort((a, b) => b.count - a.count);

        sendSuccessResponse(res, {
            // Top-level counts — matches LocationAnalyticsData frontend type
            totalLocations,
            totalAds,
            totalUsers,
            // Shaped to match frontend type: { _id, city, state, adsCount }
            topCities,
            // Shaped to match frontend type: { _id, count }
            adsByState,
            // Shaped to match frontend type: { _id, city, state, popularityScore, isHotZone }
            hotZones,
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
