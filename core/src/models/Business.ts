import mongoose, { Schema, Document, Model } from 'mongoose';
import { Business as SharedBusiness } from "@esparex/shared";
import { hasValidCoordinateArray } from '@esparex/shared';
import { BUSINESS_STATUS, BUSINESS_STATUS_VALUES } from '@esparex/shared';
import { ID_PROOF_TYPE_VALUES, type IdProofTypeValue } from '@esparex/shared';

export interface IBusinessDocument {
    type: 'id_proof' | 'business_proof' | 'certificate';
    url: string;
    uploadedAt: Date;
    expiryDate?: Date;
    version: number;
    idProofType?: IdProofTypeValue;
}

export interface IBusiness extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    description: string;
    businessTypes: string[];
    locationId?: mongoose.Types.ObjectId | null;
    location: SharedBusiness['location'];
    mobile: string;
    email: string;
    website?: string;
    gstNumber?: string;
    registrationNumber?: string;
    workingHours?: SharedBusiness['workingHours'];
    images: string[];
    documents: IBusinessDocument[];
    trustScore: number;
    isVerified: boolean;
    status: SharedBusiness['status'];
    rejectionReason?: string;
    approvedAt?: Date;
    expiresAt?: Date;
    expiryWarningSentAt?: Date;
    expiryWarningCount: number;
    lastExpiryWarningChannel?: string;
    slug?: string;
    branding?: {
        logoUrl?: string;
        bannerUrl?: string;
        tagline?: string;
        description?: string;
        socialLinks?: {
            facebook?: string;
            instagram?: string;
            whatsapp?: string;
        };
    };
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    deletedAt?: Date;
    softDelete(): Promise<this>;
    restore(): Promise<this>;
}

const normalizeEmail = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim().toLowerCase();
    return normalized || undefined;
};

const normalizeBusinessIdentifier = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim().toUpperCase();
    return normalized || undefined;
};

const BusinessDocumentSchema = new Schema({
    type: { type: String, enum: ['id_proof', 'business_proof', 'certificate'], required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    version: { type: Number, default: 1 },
    idProofType: { type: String, enum: ID_PROOF_TYPE_VALUES, required: false }
}, { _id: false });

const BusinessSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String },
    businessTypes: [{ type: String }],
    locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
    location: {
        address: { type: String, required: true },
        display: { type: String },
        shopNo: { type: String },
        street: { type: String },
        landmark: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String },
        pincode: { type: String },
        coordinates: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: {
                type: [Number],
                required: false,
                validate: {
                    validator: (coords: number[]) => !coords || hasValidCoordinateArray(coords),
                    message: 'Valid [longitude, latitude] coordinates are required.'
                }
            }
        }
    },
    mobile: { type: String, required: true }, // Normalized to mobile (was phone)
    email: { type: String, required: true, set: normalizeEmail },
    website: { type: String },
    gstNumber: { type: String, set: normalizeBusinessIdentifier },
    registrationNumber: { type: String, set: normalizeBusinessIdentifier },
    workingHours: { type: Schema.Types.Mixed }, // flexible structure
    images: [{ type: String }],
    documents: [BusinessDocumentSchema],
    trustScore: { type: Number, default: 50, min: 0, max: 100 },
    isVerified: { type: Boolean, default: false },
    status: {
        type: String,
        enum: BUSINESS_STATUS_VALUES,
        default: BUSINESS_STATUS.PENDING
    },
    rejectionReason: { type: String },
    approvedAt: { type: Date },
    expiresAt: { type: Date },
    expiryWarningSentAt: { type: Date },
    expiryWarningCount: { type: Number, default: 0 },
    lastExpiryWarningChannel: { type: String },
    slug: { type: String },
    branding: {
        logoUrl: { type: String },
        bannerUrl: { type: String },
        tagline: { type: String },
        description: { type: String },
        socialLinks: {
            facebook: { type: String },
            instagram: { type: String },
            whatsapp: { type: String }
        }
    },
}, { timestamps: true });


import softDeletePlugin from '../utils/softDeletePlugin';
import { generateUniqueSlug } from '../utils/slugGenerator';

BusinessSchema.plugin(softDeletePlugin);


// PRE-SAVE HOOK: Generate slug — immutable after creation.
// Removing isModified('name') prevents slug mutation on edits, which would
// break external links and canonical tags.
BusinessSchema.pre('save', async function () {

    if (!this.slug) {
        this.slug = await generateUniqueSlug(Business, this.name as string, undefined, undefined, 'slug');
    }
});

BusinessSchema.pre('findOneAndUpdate', function () {
    const update = this.getUpdate() as Record<string, unknown> | undefined;
    if (!update) return;
});

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

BusinessSchema.index({ status: 1 }, { name: 'idx_business_status' });
BusinessSchema.index({ "location.coordinates": "2dsphere" }, { name: 'idx_business_location_coordinates_2dsphere' });
BusinessSchema.index({ "location.city": 1 }, { name: 'idx_business_location_city' });
BusinessSchema.index({ locationId: 1 }, { name: 'idx_business_locationId' });
BusinessSchema.index({ isVerified: 1 }, { name: 'idx_business_isVerified' });
BusinessSchema.index({ slug: 1 }, { name: 'idx_business_slug_unique', unique: true, sparse: true });
BusinessSchema.index({ isDeleted: 1 }, { name: 'idx_business_isDeleted' });
// Keep a dedicated read-path index for owner lookups without colliding with the
// partial unique ownership constraint below.
BusinessSchema.index({ userId: 1, isDeleted: 1 }, { name: 'idx_business_userId_isDeleted' });
BusinessSchema.index({ expiresAt: 1 }, { name: 'idx_business_expiresAt' });

const activeBusinessPartialFilter = { isDeleted: false };

// Freshness index for active records (partial)
// Note: Consolidating with idx_business_status_createdAt by adding isDeleted to key pattern
// to satisfy Index Governance SSOT requirements while maintaining partial optimization.
BusinessSchema.index(
    { status: 1, isDeleted: 1, createdAt: -1 }, 
    { 
        name: 'idx_business_active_freshness_partial',
        partialFilterExpression: activeBusinessPartialFilter 
    }
);

BusinessSchema.index(
    { userId: 1 },
    {
        name: 'idx_business_userId_unique_active',
        unique: true,
        partialFilterExpression: activeBusinessPartialFilter
    }
);

BusinessSchema.index(
    { gstNumber: 1 },
    {
        name: 'idx_business_gstNumber_unique_active_ci',
        unique: true,
        partialFilterExpression: {
            ...activeBusinessPartialFilter,
            gstNumber: { $exists: true, $type: 'string' }
        },
        collation: { locale: 'en', strength: 2 }
    }
);

BusinessSchema.index(
    { email: 1 },
    {
        name: 'idx_business_email_unique_active_ci',
        unique: true,
        partialFilterExpression: {
            ...activeBusinessPartialFilter,
            email: { $exists: true, $type: 'string' }
        },
        collation: { locale: 'en', strength: 2 }
    }
);

BusinessSchema.index(
    { mobile: 1 },
    {
        name: 'idx_business_mobile_unique_active',
        unique: true,
        partialFilterExpression: {
            ...activeBusinessPartialFilter,
            mobile: { $exists: true, $type: 'string' }
        }
    }
);

BusinessSchema.index(
    { registrationNumber: 1 },
    {
        name: 'idx_business_registrationNumber_unique_active_ci',
        unique: true,
        partialFilterExpression: {
            ...activeBusinessPartialFilter,
            registrationNumber: { $exists: true, $type: 'string' }
        },
        collation: { locale: 'en', strength: 2 }
    }
);


const transformLogic = function (_doc: unknown, ret: Record<string, unknown>) {
    return ret;
};

// toJSON and toObject Transform - Convert _id to id
BusinessSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: transformLogic
});

BusinessSchema.set('toObject', {
    virtuals: true,
    versionKey: false,
    transform: transformLogic
});

import { getUserConnection } from '../infrastructure/db';
const Business: Model<IBusiness> = (getUserConnection().models.Business as Model<IBusiness> | undefined) || getUserConnection().model<IBusiness>('Business', BusinessSchema);

export default Business;
