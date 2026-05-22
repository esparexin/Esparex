import { Schema, type Document, type Model, Types } from 'mongoose';
import slugify from 'slugify';
import { getUserConnection } from '../config/db';
import { applyToJSONTransform } from '../utils/schemaOptions';

export const CATALOG_REQUEST_TYPE_VALUES = ['brand', 'model'] as const;
export type CatalogRequestTypeValue = (typeof CATALOG_REQUEST_TYPE_VALUES)[number];

export const CATALOG_REQUEST_STATUS_VALUES = ['pending', 'approved', 'rejected', 'merged'] as const;
export type CatalogRequestStatusValue = (typeof CATALOG_REQUEST_STATUS_VALUES)[number];

export interface ICatalogRequest extends Document {
    requestType: CatalogRequestTypeValue;
    categoryId: Types.ObjectId;
    parentBrandId?: Types.ObjectId | null;

    requestedName: string;
    canonicalName: string;
    normalizedName: string;
    slug: string;

    /** First user who submitted this suggestion. */
    requestedBy: Types.ObjectId;
    /** All users who submitted the same normalized suggestion (globally deduped). */
    requestedByUsers: Types.ObjectId[];
    /** Optional opt-in subscribers who want notification on approval/rejection. */
    subscriberUsers: Types.ObjectId[];
    /** Total number of times this suggestion has been submitted across all users. */
    requestCount: number;

    status: CatalogRequestStatusValue;

    approvedEntityId?: Types.ObjectId | null;
    /** Set when admin marks as merged into an existing entity (was: duplicateOfEntityId). */
    mergedIntoEntityId?: Types.ObjectId | null;

    rejectionReason?: string | null;
    adminNotes?: string | null;

    approvedBy?: Types.ObjectId | null;
    approvedAt?: Date | null;
    rejectedBy?: Types.ObjectId | null;
    rejectedAt?: Date | null;
    moderationIntelligence?: {
        moderatorTrustScore?: number;
        moderationReliabilityScore?: number;
        aliasApprovalConfidence?: number;
        synonymApprovalConfidence?: number;
        duplicateConfidenceScore?: number;
        canonicalCertaintyScore?: number;
        aiHintCount?: number;
        lastEvaluatedAt?: Date;
    };

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
        canonicalName: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
        normalizedName: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
        slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 180 },

        requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        requestedByUsers: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
        subscriberUsers: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
        requestCount: { type: Number, default: 1, min: 1 },

        status: {
            type: String,
            enum: CATALOG_REQUEST_STATUS_VALUES,
            default: 'pending',
            required: true,
        },

        approvedEntityId: { type: Schema.Types.ObjectId, default: null },
        mergedIntoEntityId: { type: Schema.Types.ObjectId, default: null },

        rejectionReason: { type: String, default: null, maxlength: 500 },
        adminNotes: { type: String, default: null, maxlength: 1200 },

        approvedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
        approvedAt: { type: Date, default: null },
        rejectedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
        rejectedAt: { type: Date, default: null },
        moderationIntelligence: {
            moderatorTrustScore: { type: Number, default: 0.7, min: 0, max: 1 },
            moderationReliabilityScore: { type: Number, default: 0.7, min: 0, max: 1 },
            aliasApprovalConfidence: { type: Number, default: 0.6, min: 0, max: 1 },
            synonymApprovalConfidence: { type: Number, default: 0.55, min: 0, max: 1 },
            duplicateConfidenceScore: { type: Number, default: 0.5, min: 0, max: 1 },
            canonicalCertaintyScore: { type: Number, default: 0.72, min: 0, max: 1 },
            aiHintCount: { type: Number, default: 0, min: 0 },
            lastEvaluatedAt: { type: Date },
        },
    },
    {
        timestamps: true,
        collection: 'catalog_requests',
    }
);

CatalogRequestSchema.pre('validate', function () {
    const mutableDoc = this as ICatalogRequest;
    const trimmedName = mutableDoc.requestedName?.trim() || '';
    const normalizedName = normalizeCatalogRequestName(trimmedName);

    mutableDoc.requestedName = trimmedName;
    mutableDoc.canonicalName = normalizedName;
    mutableDoc.normalizedName = normalizedName;

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

    // Ensure first submitter is always in requestedByUsers
    if (mutableDoc.requestedBy && mutableDoc.requestedByUsers.length === 0) {
        mutableDoc.requestedByUsers = [mutableDoc.requestedBy];
    }
});

// ─── Indexes ──────────────────────────────────────────────────────────────────

/**
 * PRIMARY GLOBAL DEDUPLICATION INDEX
 * Used on every createCatalogRequest call to find an existing pending request
 * with the same normalized canonical value, regardless of who submitted it.
 */
CatalogRequestSchema.index(
    { requestType: 1, canonicalName: 1, categoryId: 1, parentBrandId: 1, status: 1 },
    {
        name: 'idx_catalog_requests_global_dedup',
        partialFilterExpression: { status: 'pending' },
    }
);

// Admin list view: filter by type + status, sorted by date
CatalogRequestSchema.index(
    { requestType: 1, status: 1, createdAt: -1 },
    { name: 'idx_catalog_requests_requestType_status_createdAt' }
);

// Name-based search (admin)
CatalogRequestSchema.index(
    { normalizedName: 1, categoryId: 1 },
    { name: 'idx_catalog_requests_normalizedName_categoryId' }
);

CatalogRequestSchema.index(
    { normalizedName: 1, parentBrandId: 1 },
    { name: 'idx_catalog_requests_normalizedName_parentBrandId' }
);

// "My Requests" page: requests by first submitter
CatalogRequestSchema.index(
    { requestedBy: 1, status: 1, createdAt: -1 },
    { name: 'idx_catalog_requests_requestedBy_status_createdAt' }
);

// Subscriber notification: find all requests a user submitted (any role)
CatalogRequestSchema.index(
    { requestedByUsers: 1 },
    { name: 'idx_catalog_requests_requestedByUsers' }
);

CatalogRequestSchema.index(
    { 'moderationIntelligence.moderatorTrustScore': -1, status: 1 },
    { name: 'idx_catalog_requests_moderator_trust_status' }
);

applyToJSONTransform(CatalogRequestSchema);

const modelName = 'CatalogRequest';
const connection = getUserConnection();

const CatalogRequest: Model<ICatalogRequest> =
    (connection.models[modelName] as Model<ICatalogRequest>) ||
    connection.model<ICatalogRequest>(modelName, CatalogRequestSchema);

export default CatalogRequest;
