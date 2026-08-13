import type { CatalogHealthMetricsDTO } from '@esparex/contracts';

export type LocationIdLike = { toString: () => string } | string;

export interface FacetCountItem {
    count: number;
}

export interface UnifiedAdStatsFacet {
    totalAds: FacetCountItem[];
    activeAds: FacetCountItem[];
    pendingAds: FacetCountItem[];
    totalServices: FacetCountItem[];
    activeServices: FacetCountItem[];
    pendingServices: FacetCountItem[];
    rejectedServices: FacetCountItem[];
    totalSpareParts: FacetCountItem[];
    activeSpareParts: FacetCountItem[];
    pendingSpareParts: FacetCountItem[];
}

export interface RevenueTotalAggItem {
    _id: null;
    total: number;
}

export interface DashboardOverviewStatsRaw {
    totalUsers: number;
    unifiedStats: [UnifiedAdStatsFacet];
    pendingModels: number;
    openReports: number;
    pendingBusinesses: number;
    totalRevenueAgg: RevenueTotalAggItem[];
    catalogHealth: CatalogHealthMetricsDTO;
}

export interface DashboardCardAdStatsFacet {
    live: FacetCountItem[];
    pending: FacetCountItem[];
}

export interface DashboardCardStatsRaw {
    totalUsers: number;
    adStats: [DashboardCardAdStatsFacet];
    totalReports: number;
    totalBusinesses: number;
    totalRevenueAgg: RevenueTotalAggItem[];
    catalogHealth: CatalogHealthMetricsDTO;
}

export interface AdminLogAdminUser {
    _id?: unknown;
    firstName?: string;
    lastName?: string;
    email?: string;
}

export interface AdminLogSummary {
    _id: unknown;
    action?: string;
    entity?: string;
    entityId?: string;
    adminId?: AdminLogAdminUser | string | null;
    details?: Record<string, unknown>;
    ipAddress?: string;
    createdAt?: Date | string;
}

export interface ContactSubmissionDocument {
    _id: unknown;
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
    status?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    [key: string]: unknown;
}

export interface LocationAnalyticsParams {
    sixMonthsAgo: Date;
    buildScopedLocationQuery: (extra?: Record<string, unknown>) => Record<string, unknown>;
    buildScopedAdQuery: (extra?: Record<string, unknown>) => Record<string, unknown>;
    buildScopedUserQuery: (extra?: Record<string, unknown>) => Record<string, unknown>;
    hotZoneQuery: Record<string, unknown>;
}

export interface AdsByLocationAggItem {
    _id: unknown;
    adsCount: number;
}

export interface MonthlyCountAggItem {
    _id: { month: number; year: number };
    count: number;
}

export interface HotZoneLocationSummary {
    _id?: unknown;
    locationId?: string;
    popularityScore?: number;
    searchCount?: number;
    adsCount?: number;
}

export interface LocationAnalyticsRawData {
    totalLocations: number;
    totalAds: number;
    totalUsers: number;
    adsByLocationAgg: AdsByLocationAggItem[];
    monthlyAds: MonthlyCountAggItem[];
    monthlyUsers: MonthlyCountAggItem[];
    monthlyLocs: MonthlyCountAggItem[];
    topHotZonesRaw: HotZoneLocationSummary[];
}

export interface AdminLocationSummary {
    _id?: LocationIdLike;
    name?: string;
    country?: string;
    level?: string;
    parentId?: LocationIdLike | null;
    path?: LocationIdLike[];
}

export interface AdminDashboardRepositoryPort {
    getDashboardOverviewStats(publicAdFilter: Record<string, unknown>): Promise<DashboardOverviewStatsRaw>;
    getCatalogHealthMetrics(): Promise<CatalogHealthMetricsDTO>;
    getDashboardCardStats(publicAdFilter: Record<string, unknown>): Promise<DashboardCardStatsRaw>;
    getRecentAdminLogs(limit: number): Promise<AdminLogSummary[]>;
    getContactSubmissionsPaginated(query: Record<string, unknown>, skip: number, limit: number): Promise<[ContactSubmissionDocument[], number]>;
    updateContactSubmissionById(id: string, status: string): Promise<ContactSubmissionDocument | null>;
    getLocationAnalyticsRawData(params: LocationAnalyticsParams): Promise<LocationAnalyticsRawData>;
    getHotZoneLocations(locationIds: string[]): Promise<AdminLocationSummary[]>;
    getAnalyticsLocations(locationIds: string[]): Promise<AdminLocationSummary[]>;
    getCatalogEntityCounts(): Promise<Record<string, number>>;
}
