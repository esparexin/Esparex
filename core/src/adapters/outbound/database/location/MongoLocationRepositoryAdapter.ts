import mongoose, { type Query } from 'mongoose';
import Location, { type ILocation } from '../../../../models/Location';
import { LocationRepositoryPort } from '../../../../domains/location';

export class MongoLocationRepositoryAdapter implements LocationRepositoryPort {
    public findById(id: unknown): Query<ILocation | null, ILocation> {
        if (typeof id === 'string' && !mongoose.Types.ObjectId.isValid(id)) {
            return Location.findOne({ _id: new mongoose.Types.ObjectId() }) as Query<ILocation | null, ILocation>;
        }
        return Location.findById(id) as Query<ILocation | null, ILocation>;
    }

    public findOne(query: Record<string, unknown>): Query<ILocation | null, ILocation> {
        return Location.findOne(query) as Query<ILocation | null, ILocation>;
    }

    public findMany(query: Record<string, unknown>): Query<ILocation[], ILocation> {
        return Location.find(query) as Query<ILocation[], ILocation>;
    }

    public countDocuments(query: Record<string, unknown>): Query<number, ILocation> {
        return Location.countDocuments(query) as unknown as Query<number, ILocation>;
    }

    public estimatedDocumentCount(): Query<number, ILocation> {
        return Location.estimatedDocumentCount() as unknown as Query<number, ILocation>;
    }

    public async exists(query: Record<string, unknown>): Promise<{ _id: unknown } | null> {
        return Location.exists(query) as Promise<{ _id: unknown } | null>;
    }

    public async createLocation(data: Partial<ILocation>): Promise<ILocation> {
        return Location.create(data) as unknown as Promise<ILocation>;
    }

    public async createManyLocations(data: Partial<ILocation>[]): Promise<ILocation[]> {
        return Location.create(data) as unknown as Promise<ILocation[]>;
    }

    public async bulkWriteLocations(ops: unknown[]): Promise<unknown> {
        return Location.bulkWrite(ops as Parameters<typeof Location.bulkWrite>[0]);
    }

    public async aggregate(pipeline: unknown[]): Promise<unknown[]> {
        return Location.aggregate(pipeline as mongoose.PipelineStage[]);
    }

    public async distinctStates(): Promise<string[]> {
        return Location.distinct('name', { isActive: true, level: 'state' });
    }

    public async distinct(field: string, query?: Record<string, unknown>): Promise<unknown[]> {
        return Location.distinct(field, query ?? {});
    }
}
