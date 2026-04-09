import mongoose, { Schema, Document, Model } from 'mongoose';
import { Business as SharedBusiness } from '@shared/types/Business';
import { hasValidCoordinateArray, sanitizeGeoPoint } from '@shared/utils/geoUtils';
import { BUSINESS_STATUS, BUSINESS_STATUS_VALUES } from '@shared/enums/businessStatus';
import { ID_PROOF_TYPE_VALUES, type IdProofTypeValue } from '@shared/enums/idProofType';

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
    mobile: string; // Was phone
    phone?: string; // Virtual for backward compat
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
    slug?: string;
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
    slug: { type: String },
}, { timestamps: true });

const sanitizeBusinessLocation = (value: unknown): unknown => {
    if (!value || typeof value !== 'object') return value;
    const location = value as Record<string, unknown>;
    if ('coordinates' in location) {
        const nextGeo = sanitizeGeoPoint(location.coordinates);
        if (!nextGeo) {
            delete location.coordinates;
        } else {
            location.coordinates = nextGeo;
        }
    }
    return location;
};

import softDeletePlugin from '../utils/softDeletePlugin';
import { generateUniqueSlug } from '../utils/slugGenerator';

BusinessSchema.plugin(softDeletePlugin);


// PRE-SAVE HOOK: Generate slug — immutable after creation.
// Removing isModified('name') prevents slug mutation on edits, which would
// break external links and canonical tags.
BusinessSchema.pre('save', async function () {
    this.location = sanitizeBusinessLocation(this.location) as IBusiness['location'];

    if (!this.slug) {
        this.slug = await generateUniqueSlug(Business, this.name as string, undefined, undefined, 'slug');
    }
});

BusinessSchema.pre('findOneAndUpdate', function () {
    const update = this.getUpdate() as Record<string, unknown> | undefined;
    if (!update) return;

    if ('location' in update) {
        update.location = sanitizeBusinessLocation(update.location);
    }

    if (update.$set && typeof update.$set === 'object') {
        const setObj = update.$set as Record<string, unknown>;
        if ('location' in setObj) {
            setObj.location = sanitizeBusinessLocation(setObj.location);
        }
        if ('location.coordinates' in setObj) {
            const nextGeo = sanitizeGeoPoint(setObj['location.coordinates']);
            if (!nextGeo) {
                delete setObj['location.coordinates'];
            } else {
                setObj['location.coordinates'] = nextGeo;
            }
        }
    }
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

const activeBusinessPartialFilter = { isDeleted: false };

// Partial index mapping purely active working records
BusinessSchema.index(
    { status: 1, createdAt: -1 }, 
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

// Backward Compatibility Virtual
BusinessSchema.virtual('phone')
    .get(function () { return this.mobile; })
    .set(function (v: string) { this.mobile = v; });

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

import { getUserConnection } from '../config/db';
const Business: Model<IBusiness> = getUserConnection().models.Business || getUserConnection().model<IBusiness>('Business', BusinessSchema);

export default Business;
