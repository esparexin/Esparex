import LocationAnalytics from '../../../../models/LocationAnalytics';
import { LocationAnalyticsRepositoryPort } from '../../../../domains/location';

export class MongoLocationAnalyticsRepositoryAdapter implements LocationAnalyticsRepositoryPort {
    public findAnalytics(query: any): any {
        return LocationAnalytics.find(query);
    }

    public async bulkWriteAnalytics(ops: any[]): Promise<any> {
        return LocationAnalytics.bulkWrite(ops as Parameters<typeof LocationAnalytics.bulkWrite>[0]);
    }

    public async recordSearchAnalytics(locationIds: string[]): Promise<void> {
        if (!locationIds || locationIds.length === 0) return;
        const ops = locationIds.map((id) => ({
            updateOne: {
                filter: { locationId: id },
                update: {
                    $inc: { searchCount: 1 },
                    $set: { lastSearchedAt: new Date() }
                },
                upsert: true
            }
        }));
        await LocationAnalytics.bulkWrite(ops as Parameters<typeof LocationAnalytics.bulkWrite>[0]);
    }
}
