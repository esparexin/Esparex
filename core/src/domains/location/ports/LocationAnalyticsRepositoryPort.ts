import type { Query } from 'mongoose';
import type { ILocationAnalytics } from '../../../models/LocationAnalytics';

/**
 * @todo ARCH-118: Transitional dependency on Mongoose.
 */
export interface LocationAnalyticsRepositoryPort {
    findAnalytics(query: Record<string, unknown>): Query<ILocationAnalytics[], ILocationAnalytics>;
    bulkWriteAnalytics(ops: unknown[]): Promise<unknown>;
    recordSearchAnalytics(locationIds: string[]): Promise<void>;
}
