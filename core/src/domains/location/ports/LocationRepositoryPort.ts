import type { Query } from 'mongoose';

export interface LocationRepositoryPort {
    findById(id: unknown): Query<any, any>;
    findOne(query: any): Query<any, any>;
    findMany(query: any): Query<any[], any>;
    countDocuments(query: any): Query<number, any>;
    estimatedDocumentCount(): Query<number, any>;
    exists(query: any): Promise<any>;

    createLocation(data: any): Promise<any>;
    createManyLocations(data: any[]): Promise<any[]>;
    bulkWriteLocations(ops: any[]): Promise<any>;
    aggregate(pipeline: any[]): Promise<any[]>;
    distinctStates(): Promise<string[]>;
    distinct(field: string, query?: any): Promise<any[]>;
}

