export interface AdminDashboardRepositoryPort {
    getDashboardOverviewStats(publicAdFilter: any): Promise<any>;
    getCatalogHealthMetrics(): Promise<any>;
    getDashboardCardStats(publicAdFilter: any): Promise<any>;
    getRecentAdminLogs(limit: number): Promise<any[]>;
    getContactSubmissionsPaginated(query: any, skip: number, limit: number): Promise<[any[], number]>;
    updateContactSubmissionById(id: string, status: string): Promise<any>;
    getLocationAnalyticsRawData(params: any): Promise<any>;
    getHotZoneLocations(locationIds: string[]): Promise<any[]>;
    getAnalyticsLocations(locationIds: string[]): Promise<any[]>;
}
