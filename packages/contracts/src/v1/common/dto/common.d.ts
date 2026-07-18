export type MongoId = string;
export interface BaseEntity {
    _id: MongoId;
    createdAt: Date;
    updatedAt: Date;
}
