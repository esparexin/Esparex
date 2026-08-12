import type { CatalogHealthMetricsDTO } from '@esparex/contracts';

export interface AdminDashboardRepositoryPort {
    getDashboardOverviewStats(publicAdFilter: Record<string, unknown>): Promise<any>;
    getCatalogHealthMetrics(): Promise<CatalogHealthMetricsDTO>;
    getDashboardCardStats(publicAdFilter: Record<string, unknown>): Promise<any>;
    getRecentAdminLogs(limit: number): Promise<any[]>;
    getContactSubmissionsPaginated(query: Record<string, unknown>, skip: number, limit: number): Promise<[any[], number]>;
    updateContactSubmissionById(id: string, status: string): Promise<any>;
    getLocationAnalyticsRawData(params: Record<string, unknown>): Promise<any>;
    getHotZoneLocations(locationIds: string[]): Promise<any[]>;
    getAnalyticsLocations(locationIds: string[]): Promise<any[]>;
    getCatalogEntityCounts(): Promise<Record<string, number>>;
}
