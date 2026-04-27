"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const _shared_1 = require("@shared");
const businessStatus_1 = require("@core/constants/enums/businessStatus");
const idProofType_1 = require("@core/constants/enums/idProofType");
const normalizeEmail = (value) => {
    if (typeof value !== 'string')
        return undefined;
    const normalized = value.trim().toLowerCase();
    return normalized || undefined;
};
const normalizeBusinessIdentifier = (value) => {
    if (typeof value !== 'string')
        return undefined;
    const normalized = value.trim().toUpperCase();
    return normalized || undefined;
};
const BusinessDocumentSchema = new mongoose_1.Schema({
    type: { type: String, enum: ['id_proof', 'business_proof', 'certificate'], required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    version: { type: Number, default: 1 },
    idProofType: { type: String, enum: idProofType_1.ID_PROOF_TYPE_VALUES, required: false }
}, { _id: false });
const BusinessSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String },
    businessTypes: [{ type: String }],
    locationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Location' },
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
                    validator: (coords) => !coords || (0, _shared_1.hasValidCoordinateArray)(coords),
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
    workingHours: { type: mongoose_1.Schema.Types.Mixed }, // flexible structure
    images: [{ type: String }],
    documents: [BusinessDocumentSchema],
    trustScore: { type: Number, default: 50, min: 0, max: 100 },
    isVerified: { type: Boolean, default: false },
    status: {
        type: String,
        enum: businessStatus_1.BUSINESS_STATUS_VALUES,
        default: businessStatus_1.BUSINESS_STATUS.PENDING
    },
    rejectionReason: { type: String },
    approvedAt: { type: Date },
    expiresAt: { type: Date },
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
const sanitizeBusinessLocation = (value) => {
    if (!value || typeof value !== 'object')
        return value;
    const location = value;
    if ('coordinates' in location) {
        const nextGeo = (0, _shared_1.sanitizeGeoPoint)(location.coordinates);
        if (!nextGeo) {
            delete location.coordinates;
        }
        else {
            location.coordinates = nextGeo;
        }
    }
    return location;
};
const softDeletePlugin_1 = __importDefault(require("@core/utils/softDeletePlugin"));
const slugGenerator_1 = require("@core/utils/slugGenerator");
BusinessSchema.plugin(softDeletePlugin_1.default);
// PRE-SAVE HOOK: Generate slug — immutable after creation.
// Removing isModified('name') prevents slug mutation on edits, which would
// break external links and canonical tags.
BusinessSchema.pre('save', async function () {
    this.location = sanitizeBusinessLocation(this.location);
    if (!this.slug) {
        this.slug = await (0, slugGenerator_1.generateUniqueSlug)(Business, this.name, undefined, undefined, 'slug');
    }
});
BusinessSchema.pre('findOneAndUpdate', function () {
    const update = this.getUpdate();
    if (!update)
        return;
    if ('location' in update) {
        update.location = sanitizeBusinessLocation(update.location);
    }
    if (update.$set && typeof update.$set === 'object') {
        const setObj = update.$set;
        if ('location' in setObj) {
            setObj.location = sanitizeBusinessLocation(setObj.location);
        }
        if ('location.coordinates' in setObj) {
            const nextGeo = (0, _shared_1.sanitizeGeoPoint)(setObj['location.coordinates']);
            if (!nextGeo) {
                delete setObj['location.coordinates'];
            }
            else {
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
// Keep a dedicated read-path index for owner lookups without colliding with the
// partial unique ownership constraint below.
BusinessSchema.index({ userId: 1, isDeleted: 1 }, { name: 'idx_business_userId_isDeleted' });
const activeBusinessPartialFilter = { isDeleted: false };
// Partial index mapping purely active working records
BusinessSchema.index({ status: 1, createdAt: -1 }, {
    name: 'idx_business_active_freshness_partial',
    partialFilterExpression: activeBusinessPartialFilter
});
BusinessSchema.index({ userId: 1 }, {
    name: 'idx_business_userId_unique_active',
    unique: true,
    partialFilterExpression: activeBusinessPartialFilter
});
BusinessSchema.index({ gstNumber: 1 }, {
    name: 'idx_business_gstNumber_unique_active_ci',
    unique: true,
    partialFilterExpression: {
        ...activeBusinessPartialFilter,
        gstNumber: { $exists: true, $type: 'string' }
    },
    collation: { locale: 'en', strength: 2 }
});
BusinessSchema.index({ email: 1 }, {
    name: 'idx_business_email_unique_active_ci',
    unique: true,
    partialFilterExpression: {
        ...activeBusinessPartialFilter,
        email: { $exists: true, $type: 'string' }
    },
    collation: { locale: 'en', strength: 2 }
});
BusinessSchema.index({ mobile: 1 }, {
    name: 'idx_business_mobile_unique_active',
    unique: true,
    partialFilterExpression: {
        ...activeBusinessPartialFilter,
        mobile: { $exists: true, $type: 'string' }
    }
});
BusinessSchema.index({ registrationNumber: 1 }, {
    name: 'idx_business_registrationNumber_unique_active_ci',
    unique: true,
    partialFilterExpression: {
        ...activeBusinessPartialFilter,
        registrationNumber: { $exists: true, $type: 'string' }
    },
    collation: { locale: 'en', strength: 2 }
});
// Backward Compatibility Virtual
BusinessSchema.virtual('phone')
    .get(function () { return this.mobile; })
    .set(function (v) { this.mobile = v; });
const transformLogic = function (_doc, ret) {
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
const db_1 = require("@core/config/db");
const Business = (0, db_1.getUserConnection)().models.Business || (0, db_1.getUserConnection)().model('Business', BusinessSchema);
exports.default = Business;
//# sourceMappingURL=Business.js.map