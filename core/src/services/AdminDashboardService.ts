import User from '@esparex/core/models/User';
import Ad from '@esparex/core/models/Ad';

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

import CatalogModel from '@esparex/core/models/Model';
import Report from '@esparex/core/models/Report';
import Business from '@esparex/core/models/Business';
import RevenueAnalytics from '@esparex/core/models/RevenueAnalytics';
import ContactSubmission from '@esparex/core/models/ContactSubmission';
import Location from '@esparex/core/models/Location';
import LocationAnalytics from '@esparex/core/models/LocationAnalytics';
import AdminLog from '@esparex/core/models/AdminLog';
import { LISTING_STATUS } from "@esparex/core/constants/enums/listingStatus";
import { LISTING_TYPE } from '@esparex/core/constants/enums/listingType';
import { BUSINESS_STATUS } from '@esparex/core/constants/enums/businessStatus';
import { CATALOG_STATUS } from '@esparex/core/constants/enums/catalogStatus';
import { REPORT_STATUS } from '@esparex/core/constants/enums/reportStatus';
import { USER_STATUS } from '@esparex/core/constants/enums/userStatus';
import { escapeRegExp } from '@esparex/core/utils/stringUtils';
import {
    buildLocationSummary,
    loadHierarchyMapForLocations,
    normalizeStateLabel,
    resolveLocationScope,
} from '@esparex/core/utils/locationHierarchy';

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
                    pendingAds:      [{ $match: { listingType: LISTING_TYPE.AD,      status: LISTING_STATUS.PENDING } }, { $count: "count" }],
                    totalServices:    [{ $match: { listingType: LISTING_TYPE.SERVICE } }, { $count: "count" }],
                    activeServices:   [{ $match: { listingType: LISTING_TYPE.SERVICE, ...publicAdFilter } }, { $count: "count" }],
                    pendingServices:  [{ $match: { listingType: LISTING_TYPE.SERVICE, status: LISTING_STATUS.PENDING } }, { $count: "count" }],
                    rejectedServices: [{ $match: { listingType: LISTING_TYPE.SERVICE, status: LISTING_STATUS.REJECTED } }, { $count: "count" }],
                    totalSpareParts:  [{ $match: { listingType: LISTING_TYPE.SPARE_PART } }, { $count: "count" }],
                    activeSpareParts: [{ $match: { listingType: LISTING_TYPE.SPARE_PART, ...publicAdFilter } }, { $count: "count" }],
                    pendingSpareParts:[{ $match: { listingType: LISTING_TYPE.SPARE_PART, status: LISTING_STATUS.PENDING } }, { $count: "count" }]
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
                    pending: [{ $match: { listingType: LISTING_TYPE.AD, status: LISTING_STATUS.PENDING } }, { $count: "count" }]
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
        Ad.countDocuments(buildScopedAdQuery({ status: LISTING_STATUS.LIVE })),
        User.countDocuments(buildScopedUserQuery({ status: USER_STATUS.LIVE })),
        Ad.aggregate<AdsByLocationResult>([
            {
                $match: {
                    ...buildScopedAdQuery({ status: LISTING_STATUS.LIVE }),
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

export const adminGetLocationAnalyticsData = async (reqQuery: Record<string, unknown>) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const cityFilter = typeof reqQuery.city === 'string' ? reqQuery.city.trim() : '';
    const districtFilter = typeof reqQuery.district === 'string' ? reqQuery.district.trim() : '';
    const stateFilter = typeof reqQuery.state === 'string' ? reqQuery.state.trim() : '';
    const countryFilter = typeof reqQuery.country === 'string' ? reqQuery.country.trim() : '';

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
        return {
            totalLocations: 0,
            totalAds: 0,
            totalUsers: 0,
            topCities: [],
            adsByState: [],
            hotZones: [],
            monthlyTrends: [],
        };
    }

    const hotZoneQuery: Record<string, unknown> = {
        isHotZone: true,
        ...(Array.isArray(locationScopeIds) ? { locationId: { $in: locationScopeIds } } : {}),
    };

    const {
        totalLocations,
        totalAds,
        totalUsers,
        adsByLocationAgg,
        monthlyAds,
        monthlyUsers,
        monthlyLocs,
        topHotZonesRaw,
    } = await getLocationAnalyticsRawData({
        sixMonthsAgo,
        buildScopedLocationQuery,
        buildScopedAdQuery,
        buildScopedUserQuery,
        hotZoneQuery,
    });

    const hotZoneLocationIds = topHotZonesRaw.map((zone) => zone.locationId);
    const hotZoneLocations = await getHotZoneLocations(hotZoneLocationIds.map(String));
    const hotZoneHierarchyMap = await loadHierarchyMapForLocations(hotZoneLocations);
    const hotZoneLocationMap = new Map(
        hotZoneLocations.map((location) => [String(location._id), location])
    );
    const hotZones = topHotZonesRaw.map((zone) => {
        const location = hotZoneLocationMap.get(String(zone.locationId));
        const summary = location ? buildLocationSummary(location, hotZoneHierarchyMap) : undefined;
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
        .map((entry) => entry?._id as string | undefined)
        .filter((value): value is string => Boolean(value))
        .map((value) => String(value));
    const analyticsLocations = await getAnalyticsLocations(adsByLocationIds);
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

    return {
        totalLocations,
        totalAds,
        totalUsers,
        topCities,
        adsByState,
        hotZones,
        monthlyTrends: trends.map(t => ({
            month: t.month,
            ads: t.adsPosted,
            users: t.activeUsers,
        })),
    };
};
