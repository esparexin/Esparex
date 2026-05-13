import { Schema, type Document, type Model, Types } from 'mongoose';
import slugify from 'slugify';
import { getUserConnection } from '../config/db';
import { applyToJSONTransform } from '../utils/schemaOptions';

export const CATALOG_REQUEST_TYPE_VALUES = ['brand', 'model'] as const;
export type CatalogRequestTypeValue = (typeof CATALOG_REQUEST_TYPE_VALUES)[number];

export const CATALOG_REQUEST_STATUS_VALUES = ['pending', 'under_review', 'duplicate_review', 'approved', 'rejected', 'duplicate'] as const;
export type CatalogRequestStatusValue = (typeof CATALOG_REQUEST_STATUS_VALUES)[number];

export interface ICatalogRequest extends Document {
    requestType: CatalogRequestTypeValue;
    categoryId: Types.ObjectId;
    parentBrandId?: Types.ObjectId | null;

    requestedName: string;
    normalizedName: string;
    slug: string;

    requestedBy: Types.ObjectId;

    status: CatalogRequestStatusValue;

    approvedEntityId?: Types.ObjectId | null;
    duplicateOfEntityId?: Types.ObjectId | null;

    rejectionReason?: string | null;
    adminNotes?: string | null;

    approvedBy?: Types.ObjectId | null;
    approvedAt?: Date | null;
    rejectedBy?: Types.ObjectId | null;
    rejectedAt?: Date | null;

    createdAt: Date;
    updatedAt: Date;
}

const normalizeCatalogRequestName = (value: string): string =>
    value.trim().toLowerCase().replace(/\s+/g, ' ');

const CatalogRequestSchema = new Schema<ICatalogRequest>(
    {
        requestType: {
            type: String,
            enum: CATALOG_REQUEST_TYPE_VALUES,
            required: true,
        },

        categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
        parentBrandId: { type: Schema.Types.ObjectId, ref: 'Brand', default: null },

        requestedName: { type: String, required: true, trim: true, maxlength: 120 },
        normalizedName: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
        slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 180 },

        requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

        status: {
            type: String,
            enum: CATALOG_REQUEST_STATUS_VALUES,
            default: 'pending',
            required: true,
        },

        approvedEntityId: { type: Schema.Types.ObjectId, default: null },
        duplicateOfEntityId: { type: Schema.Types.ObjectId, default: null },

        rejectionReason: { type: String, default: null, maxlength: 500 },
        adminNotes: { type: String, default: null, maxlength: 1200 },

        approvedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
        approvedAt: { type: Date, default: null },
        rejectedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
        rejectedAt: { type: Date, default: null },
    },
    {
        timestamps: true,
        collection: 'catalog_requests',
    }
);

CatalogRequestSchema.pre('validate', function () {
    const mutableDoc = this as ICatalogRequest;
    const trimmedName = mutableDoc.requestedName?.trim() || '';

    mutableDoc.requestedName = trimmedName;
    mutableDoc.normalizedName = normalizeCatalogRequestName(trimmedName);

    if (!mutableDoc.slug) {
        const computedSlug = slugify(trimmedName, {
            lower: true,
            strict: true,
            trim: true,
        });
        mutableDoc.slug = computedSlug || `catalog-request-${Date.now()}`;
    }

    if (mutableDoc.requestType === 'brand') {
        mutableDoc.parentBrandId = null;
    }
});

CatalogRequestSchema.index(
    { requestType: 1, status: 1, createdAt: -1 },
    { name: 'idx_catalog_requests_requestType_status_createdAt' }
);

CatalogRequestSchema.index(
    { normalizedName: 1, categoryId: 1 },
    { name: 'idx_catalog_requests_normalizedName_categoryId' }
);

CatalogRequestSchema.index(
    { normalizedName: 1, parentBrandId: 1 },
    { name: 'idx_catalog_requests_normalizedName_parentBrandId' }
);

applyToJSONTransform(CatalogRequestSchema);

const modelName = 'CatalogRequest';
const connection = getUserConnection();

const CatalogRequest: Model<ICatalogRequest> =
    (connection.models[modelName] as Model<ICatalogRequest>) ||
    connection.model<ICatalogRequest>(modelName, CatalogRequestSchema);

export default CatalogRequest;
