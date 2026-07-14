import type { Query } from 'mongoose';
import type { ILocation } from '../../../models/Location';

/**
 * @todo ARCH-118: Transitional dependency on Mongoose.
 * This port is currently coupled to Mongoose's Query object because downstream services chain .select(), .lean(), etc.
 * The long-term architecture requires refactoring these services to pass FindOptions to the port instead.
 */
export interface LocationRepositoryPort {
    findById(id: unknown): Query<ILocation | null, ILocation>;
    findOne(query: Record<string, unknown>): Query<ILocation | null, ILocation>;
    findMany(query: Record<string, unknown>): Query<ILocation[], ILocation>;
    countDocuments(query: Record<string, unknown>): Query<number, ILocation>;
    estimatedDocumentCount(): Query<number, ILocation>;
    exists(query: Record<string, unknown>): Promise<{ _id: unknown } | null>;

    createLocation(data: Partial<ILocation>): Promise<ILocation>;
    createManyLocations(data: Partial<ILocation>[]): Promise<ILocation[]>;
    bulkWriteLocations(ops: unknown[]): Promise<unknown>;
    aggregate(pipeline: unknown[]): Promise<unknown[]>;
    distinctStates(): Promise<string[]>;
    distinct(field: string, query?: Record<string, unknown>): Promise<unknown[]>;
}
