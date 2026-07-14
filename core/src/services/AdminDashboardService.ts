import { adminDashboardRepository } from '../composition/admin';

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

import type { CatalogRequestStatusValue } from '../models/CatalogRequest';
import { escapeRegExp } from '../utils/stringUtils';
import {
    buildLocationSummary,
    loadHierarchyMapForLocations,
    normalizeStateLabel,
    resolveLocationScope,
} from '../utils/locationHierarchy';

export const getDashboardOverviewStats = async (publicAdFilter: Record<string, unknown>) => {
    return adminDashboardRepository.getDashboardOverviewStats(publicAdFilter);
};

// Typed status constants derived from CatalogRequestStatusValue — type-safe without
// runtime tuple indexing that would fail when the model is mocked in tests.
const CATALOG_REQUEST_PENDING_STATUS = 'pending' satisfies CatalogRequestStatusValue;
const CATALOG_REQUEST_RESOLVED_STATUSES: CatalogRequestStatusValue[] = ['approved', 'rejected', 'merged', 'resolved'];
const CATALOG_REQUEST_MERGED_STATUS = 'merged' satisfies CatalogRequestStatusValue;

export const getCatalogHealthMetrics = async () => {
    return adminDashboardRepository.getCatalogHealthMetrics();
};

export const getDashboardCardStats = async (publicAdFilter: Record<string, unknown>) => {
    return adminDashboardRepository.getDashboardCardStats(publicAdFilter);
};

export const getRecentAdminLogs = async (limit: number) => {
    return adminDashboardRepository.getRecentAdminLogs(limit);
};

export const getContactSubmissionsPaginated = async (
    query: Record<string, unknown>,
    skip: number,
    limit: number
) => {
    return adminDashboardRepository.getContactSubmissionsPaginated(query, skip, limit);
};

export const updateContactSubmissionById = async (id: string, status: string) => {
    return adminDashboardRepository.updateContactSubmissionById(id, status);
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
    return adminDashboardRepository.getLocationAnalyticsRawData(params);
};

export const getHotZoneLocations = async (locationIds: string[]) => {
    return adminDashboardRepository.getHotZoneLocations(locationIds);
};

export const getAnalyticsLocations = async (locationIds: string[]) => {
    return adminDashboardRepository.getAnalyticsLocations(locationIds);
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
        if (locationScopeIds === undefined || locationScopeIds === null) {
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
        if (locationScopeIds === undefined || locationScopeIds === null) {
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
        if (locationScopeIds === undefined || locationScopeIds === null) {
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

    const hotZoneLocationIds = topHotZonesRaw.map((zone: any) => zone.locationId);
    const hotZoneLocations = await getHotZoneLocations(hotZoneLocationIds.map(String));
    const hotZoneHierarchyMap = await loadHierarchyMapForLocations(hotZoneLocations);
    const hotZoneLocationMap = new Map(
        hotZoneLocations.map((location: any) => [String(location._id), location])
    );
    const hotZones = topHotZonesRaw.map((zone: any) => {
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

        const ads = monthlyAds.find((a: any) => a._id.month === m && a._id.year === y)?.count || 0;
        const users = monthlyUsers.find((u: any) => u._id.month === m && u._id.year === y)?.count || 0;
        const locs = monthlyLocs.find((l: any) => l._id.month === m && l._id.year === y)?.count || 0;

        trends.push({
            month: monthNames[m - 1],
            adsPosted: ads,
            activeUsers: users,
            newLocations: locs
        });
    }

    const adsByLocationIds = adsByLocationAgg
        .map((entry: any) => entry?._id as string | undefined)
        .filter((value: string | undefined): value is string => Boolean(value))
        .map((value: string) => String(value));
    const analyticsLocations = await getAnalyticsLocations(adsByLocationIds);
    const analyticsHierarchyMap = await loadHierarchyMapForLocations(analyticsLocations);
    const analyticsLocationMap = new Map(
        analyticsLocations.map((location: any) => [String(location._id), location])
    );

    const topCityMap = new Map<string, { _id: string; city: string; state: string; adsCount: number }>();
    const adsByStateMap = new Map<string, { _id: string; count: number }>();

    for (const entry of adsByLocationAgg as any[]) {
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
