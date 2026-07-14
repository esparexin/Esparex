import type { Query } from 'mongoose';

export interface AdminBoundaryRepositoryPort {
    findBoundaries(query: any): Query<any[], any>;
    countBoundaries(query: any): Query<number, any>;
    upsertBoundary(query: any, update: any, options?: any): Promise<any>;
}

