export interface AdminDashboardRepositoryPort {
    getDashboardOverviewStats(publicAdFilter: Record<string, unknown>): Promise<Record<string, unknown>>;
    getCatalogHealthMetrics(): Promise<{ pendingRequests: number; averageResolutionHours: number; mergedRequests: number }>;
    getDashboardCardStats(publicAdFilter: Record<string, unknown>): Promise<Record<string, unknown>>;
    getRecentAdminLogs(limit: number): Promise<Record<string, unknown>[]>;
    getContactSubmissionsPaginated(query: Record<string, unknown>, skip: number, limit: number): Promise<[Record<string, unknown>[], number]>;
    updateContactSubmissionById(id: string, status: string): Promise<Record<string, unknown> | null>;
    getLocationAnalyticsRawData(params: Record<string, unknown>): Promise<Record<string, unknown>>;
    getHotZoneLocations(locationIds: string[]): Promise<Record<string, unknown>[]>;
    getAnalyticsLocations(locationIds: string[]): Promise<Record<string, unknown>[]>;
}
