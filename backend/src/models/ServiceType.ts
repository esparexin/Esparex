import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IServiceType extends Document {
    name: string;
    categoryIds: mongoose.Types.ObjectId[];
    filters?: unknown[];
    isActive: boolean;
    isDeleted: boolean;
    deletedAt?: Date;
    softDelete(): Promise<this>;
    restore(): Promise<this>;
}

const ServiceTypeSchema: Schema = new Schema({
    name: { type: String, required: true },
    categoryIds: {
        type: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
        validate: {
            validator: (val: unknown[]) => val && val.length > 0,
            message: 'Service type must be mapped to at least one category'
        }
    },
    filters: { type: Array, default: [] },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

ServiceTypeSchema.index({ categoryIds: 1 }, { name: 'idx_servicetype_categoryIds' });
ServiceTypeSchema.index({ isActive: 1 }, { name: 'idx_servicetype_isActive' });
ServiceTypeSchema.index({ isDeleted: 1 }, { name: 'idx_servicetype_isDeleted' });
ServiceTypeSchema.index(
    { name: 1, categoryIds: 1 },
    {
        name: 'idx_servicetype_name_category_unique',
        unique: true,
        partialFilterExpression: { isDeleted: false }
    }
);

import softDeletePlugin from '../utils/softDeletePlugin';
ServiceTypeSchema.plugin(softDeletePlugin);

// Apply safe query scope plugin (adds .active() and .includeDeleted() chain methods)
import { installSafeSoftDeleteQuery } from '../utils/safeSoftDeleteQuery';
ServiceTypeSchema.plugin(installSafeSoftDeleteQuery);

import { getAdminConnection } from '../config/db';
import { applyToJSONTransform } from '../utils/schemaOptions';
const ServiceType: Model<IServiceType> = getAdminConnection().models.ServiceType || getAdminConnection().model<IServiceType>('ServiceType', ServiceTypeSchema);

applyToJSONTransform(ServiceTypeSchema);

export default ServiceType;
