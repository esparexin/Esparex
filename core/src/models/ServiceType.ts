import mongoose, { Schema, Document, Model } from 'mongoose';
import { CATALOG_STATUS, CATALOG_STATUS_VALUES, type CatalogStatusValue } from '../constants/enums/catalogStatus';
import {
    TAXONOMY_APPROVAL_STATUS,
    TAXONOMY_APPROVAL_STATUS_VALUES,
    TaxonomyApprovalStatusValue,
} from '../constants/enums/taxonomyApprovalStatus';
import {
    applyTaxonomyNamingDefaults,
} from '../services/catalog/taxonomySsot';
import { applyTaxonomyLifecycleFields, taxonomyEntityToJsonTransform } from './taxonomyLifecycle';

export interface IServiceType extends Document {
    name: string;
    displayName: string;
    canonicalName: string;
    slug: string;
    aliases: string[];
    synonyms: string[];
    categoryIds: mongoose.Types.ObjectId[];
    filters?: unknown[];
    isActive: boolean;
    approvalStatus: TaxonomyApprovalStatusValue;
    status: CatalogStatusValue;
    isDeleted: boolean;
    deletedAt?: Date;
    softDelete(): Promise<this>;
    restore(): Promise<this>;
}

const ServiceTypeSchema: Schema = new Schema({
    name: { type: String, required: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    canonicalName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    aliases: { type: [String], default: [] },
    synonyms: { type: [String], default: [] },
    categoryIds: {
        type: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
        validate: {
            validator: (val: unknown[]) => val && val.length > 0,
            message: 'Service type must be mapped to at least one category'
        }
    },
    filters: { type: Array, default: [] },
    isActive: { type: Boolean, default: true },
    approvalStatus: {
        type: String,
        enum: TAXONOMY_APPROVAL_STATUS_VALUES,
        default: TAXONOMY_APPROVAL_STATUS.APPROVED,
    },
    status: {
        type: String,
        enum: CATALOG_STATUS_VALUES,
        default: CATALOG_STATUS.ACTIVE,
    },
}, { timestamps: true });

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

ServiceTypeSchema.index({ categoryIds: 1 }, { name: 'idx_servicetype_categoryIds' });
ServiceTypeSchema.index({ isActive: 1 }, { name: 'idx_servicetype_isActive' });
ServiceTypeSchema.index({ approvalStatus: 1, isActive: 1 }, { name: 'idx_servicetype_approval_active' });
ServiceTypeSchema.index({ isDeleted: 1 }, { name: 'idx_servicetype_isDeleted' });
ServiceTypeSchema.index(
    { canonicalName: 1, categoryIds: 1 },
    {
        name: 'idx_servicetype_canonicalName_category_unique',
        unique: true,
        partialFilterExpression: { isDeleted: false }
    }
);
ServiceTypeSchema.index(
    { categoryIds: 1, slug: 1 },
    {
        name: 'idx_servicetype_category_slug_unique',
        unique: true,
        partialFilterExpression: { isDeleted: false }
    }
);

import softDeletePlugin from '../utils/softDeletePlugin';
ServiceTypeSchema.plugin(softDeletePlugin);

ServiceTypeSchema.pre('validate', function () {
    const mutableDoc = this as unknown as Record<string, unknown>;
    applyTaxonomyNamingDefaults(mutableDoc as Parameters<typeof applyTaxonomyNamingDefaults>[0]);
    applyTaxonomyLifecycleFields(mutableDoc, TAXONOMY_APPROVAL_STATUS.APPROVED);
    mutableDoc.name = mutableDoc.displayName;
});

// Apply safe query scope plugin (adds .active() and .includeDeleted() chain methods)
import { installSafeSoftDeleteQuery } from '../utils/safeSoftDeleteQuery';
ServiceTypeSchema.plugin(installSafeSoftDeleteQuery);

import { getUserConnection } from '../config/db';
import { applyToJSONTransform } from '../utils/schemaOptions';
const ServiceType: Model<IServiceType> = (getUserConnection().models.ServiceType as Model<IServiceType> | undefined) || getUserConnection().model<IServiceType>('ServiceType', ServiceTypeSchema);

applyToJSONTransform(ServiceTypeSchema);
ServiceTypeSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: taxonomyEntityToJsonTransform
});

export default ServiceType;
