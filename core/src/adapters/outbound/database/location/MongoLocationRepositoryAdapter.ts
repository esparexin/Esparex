import mongoose, { type Query } from 'mongoose';
import Location from '../../../../models/Location';
import { LocationRepositoryPort } from '../../../../domains/location';

export class MongoLocationRepositoryAdapter implements LocationRepositoryPort {
    public findById(id: unknown): Query<any, any> {
        if (typeof id === 'string' && !mongoose.Types.ObjectId.isValid(id)) {
            return Location.findOne({ _id: new mongoose.Types.ObjectId() }) as Query<any, any>;
        }
        return Location.findById(id);
    }

    public findOne(query: any): Query<any, any> {
        return Location.findOne(query);
    }

    public findMany(query: any): Query<any[], any> {
        return Location.find(query);
    }

    public countDocuments(query: any): Query<number, any> {
        return Location.countDocuments(query);
    }

    public estimatedDocumentCount(): Query<number, any> {
        return Location.estimatedDocumentCount();
    }


    public async exists(query: any): Promise<any> {
        return Location.exists(query);
    }

    public async createLocation(data: any): Promise<any> {
        return Location.create(data);
    }

    public async createManyLocations(data: any[]): Promise<any[]> {
        return Location.create(data);
    }

    public async bulkWriteLocations(ops: any[]): Promise<any> {
        return Location.bulkWrite(ops as Parameters<typeof Location.bulkWrite>[0]);
    }

    public async aggregate(pipeline: any[]): Promise<any[]> {
        return Location.aggregate(pipeline);
    }

    public async distinctStates(): Promise<string[]> {
        return Location.distinct('name', { isActive: true, level: 'state' });
    }

    public async distinct(field: string, query?: any): Promise<any[]> {
        return Location.distinct(field, query ?? {});
    }
}

