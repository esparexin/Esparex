import type { Query } from 'mongoose';
import AdminBoundary from '../../../../models/AdminBoundary';
import { AdminBoundaryRepositoryPort } from '../../../../domains/location';

export class MongoAdminBoundaryRepositoryAdapter implements AdminBoundaryRepositoryPort {
    public findBoundaries(query: any): Query<any[], any> {
        return AdminBoundary.find(query);
    }

    public countBoundaries(query: any): Query<number, any> {
        return AdminBoundary.countDocuments(query);
    }

    public async upsertBoundary(query: any, update: any, options?: any): Promise<any> {
        return AdminBoundary.findOneAndUpdate(query, update, options ?? { new: true, upsert: true });
    }
}
