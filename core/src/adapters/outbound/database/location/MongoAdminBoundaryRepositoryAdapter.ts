import type { Query, UpdateQuery } from 'mongoose';
import AdminBoundary, { type IAdminBoundary } from '../../../../models/AdminBoundary';
import { AdminBoundaryRepositoryPort } from '../../../../domains/location';

export class MongoAdminBoundaryRepositoryAdapter implements AdminBoundaryRepositoryPort {
    public findBoundaries(query: Record<string, unknown>): Query<IAdminBoundary[], IAdminBoundary> {
        return AdminBoundary.find(query) as Query<IAdminBoundary[], IAdminBoundary>;
    }

    public countBoundaries(query: Record<string, unknown>): Query<number, IAdminBoundary> {
        return AdminBoundary.countDocuments(query) as unknown as Query<number, IAdminBoundary>;
    }

    public async upsertBoundary(
        query: Record<string, unknown>, 
        update: UpdateQuery<IAdminBoundary>, 
        options?: Record<string, unknown>
    ): Promise<IAdminBoundary | null> {
        return AdminBoundary.findOneAndUpdate(query, update, options ?? { new: true, upsert: true }) as Promise<IAdminBoundary | null>;
    }
}
