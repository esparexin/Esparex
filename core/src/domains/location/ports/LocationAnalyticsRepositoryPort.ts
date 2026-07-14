export interface LocationAnalyticsRepositoryPort {
    findAnalytics(query: any): any;
    bulkWriteAnalytics(ops: any[]): Promise<any>;
    recordSearchAnalytics(locationIds: string[]): Promise<void>;
}
