import type { Query, UpdateQuery } from 'mongoose';
import type { IAdminBoundary } from '../../../models/AdminBoundary';

/**
 * @todo ARCH-118: Transitional dependency on Mongoose.
 * This port is currently coupled to Mongoose's Query object because downstream services chain .select(), .lean(), etc.
 */
export interface AdminBoundaryRepositoryPort {
    findBoundaries(query: Record<string, unknown>): Query<IAdminBoundary[], IAdminBoundary>;
    countBoundaries(query: Record<string, unknown>): Query<number, IAdminBoundary>;
    upsertBoundary(
        query: Record<string, unknown>, 
        update: UpdateQuery<IAdminBoundary>, 
        options?: Record<string, unknown>
    ): Promise<IAdminBoundary | null>;
}
