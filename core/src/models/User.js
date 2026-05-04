"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const shared_1 = require("@esparex/shared");
const mobileVisibility_1 = require("@esparex/shared/constants/mobileVisibility");
const db_1 = require("@core/config/db");
const userStatus_1 = require("@core/constants/enums/userStatus");
const toUserGeoPoint = (value) => {
    if (value === undefined || value === null)
        return undefined;
    if (Array.isArray(value)) {
        if (value.length !== 2) {
            return undefined; // Be resilient
        }
        if (!(0, shared_1.hasValidCoordinateArray)(value)) {
            return undefined; // Be resilient
        }
        return { type: 'Point', coordinates: [Number(value[0]), Number(value[1])] };
    }
    if (typeof value === 'object') {
        const node = value;
        // Legacy support: if it's an object with coordinates but no type, assume Point
        const coords = node.coordinates || (Array.isArray(value) ? value : undefined);
        if (Array.isArray(coords) && coords.length === 2 && (0, shared_1.hasValidCoordinateArray)(coords)) {
            return {
                type: 'Point',
                coordinates: [Number(coords[0]), Number(coords[1])]
            };
        }
        if (node.type !== 'Point') {
            return undefined; // Be resilient instead of throwing
        }
        if (!Array.isArray(node.coordinates) || node.coordinates.length !== 2) {
            return undefined;
        }
        return {
            type: 'Point',
            coordinates: [Number(node.coordinates[0]), Number(node.coordinates[1])],
        };
    }
    return undefined;
};
const normalizeUserLocation = (value) => {
    if (!value || typeof value !== 'object')
        return value;
    const location = value;
    try {
        if ('coordinates' in location) {
            const nextGeo = toUserGeoPoint(location.coordinates);
            if (!nextGeo) {
                delete location.coordinates;
            }
            else {
                location.coordinates = nextGeo;
            }
        }
    }
    catch {
        // Never crash normalization
        delete location.coordinates;
    }
    return location;
};
const normalizeUserMobileVisibility = (value) => (0, mobileVisibility_1.normalizeMobileVisibility)(value, mobileVisibility_1.MOBILE_VISIBILITY.SHOW);
const UserSchema = new mongoose_1.Schema({
    mobile: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String },
    password: { type: String },
    avatar: { type: String },
    isPhoneVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    role: {
        type: String,
        enum: ['user', 'business', 'admin', 'superadmin', 'super_admin'],
        default: 'user',
    },
    status: {
        type: String,
        enum: userStatus_1.USER_STATUS_VALUES,
        default: userStatus_1.USER_STATUS.LIVE,
    },
    statusChangedAt: { type: Date },
    statusReason: { type: String },
    businessId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Business' },
    location: {
        coordinates: {
            type: {
                type: String,
                enum: ['Point'],
            },
            coordinates: {
                type: [Number],
            },
        },
        locationId: { type: mongoose_1.Schema.Types.ObjectId },
        city: { type: String },
        state: { type: String },
    },
    trustScore: { type: Number, default: 0 },
    adminBadges: [{ type: String }],
    strikeCount: { type: Number, default: 0 },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    tokenVersion: { type: Number, default: 0 },
    fcmTokens: [{
            token: { type: String },
            platform: { type: String },
            lastActive: { type: Date }
        }],
    notificationSettings: { type: mongoose_1.Schema.Types.Mixed },
    mobileVisibility: {
        type: String,
        enum: ['show', 'hide', 'on-request', 'public', 'contacts', 'private'],
        default: mobileVisibility_1.MOBILE_VISIBILITY.SHOW,
        set: normalizeUserMobileVisibility,
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    lastLoginAt: { type: Date, default: null },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: function (_doc, ret) {
            const json = ret;
            json.id = json._id?.toString();
            delete json._id;
            return json;
        }
    },
    toObject: { virtuals: true, versionKey: false }
});
// Indexes
UserSchema.index({ mobile: 1 }, { unique: true, name: 'idx_user_mobile_unique_idx' });
UserSchema.index({ email: 1 }, { unique: true, sparse: true, name: 'idx_user_email_unique_idx' });
UserSchema.index({ role: 1, status: 1 }, { name: 'idx_user_role_status_idx' });
UserSchema.index({ isDeleted: 1 }, { name: 'idx_user_deletedAt_idx' });
UserSchema.index({ 'location.coordinates': '2dsphere' }, { sparse: true, name: 'idx_user_location_coordinates_2dsphere' });
UserSchema.pre('save', function () {
    this.location = normalizeUserLocation(this.location);
    this.mobileVisibility = normalizeUserMobileVisibility(this.mobileVisibility);
});
UserSchema.pre('findOneAndUpdate', function () {
    const update = this.getUpdate();
    if (!update || Array.isArray(update))
        return;
    if ('location' in update) {
        update.location = normalizeUserLocation(update.location);
    }
    if ('mobileVisibility' in update) {
        update.mobileVisibility = normalizeUserMobileVisibility(update.mobileVisibility);
    }
    if ('location.coordinates' in update) {
        const nextGeo = toUserGeoPoint(update['location.coordinates']);
        if (!nextGeo) {
            delete update['location.coordinates'];
        }
        else {
            update['location.coordinates'] = nextGeo;
        }
    }
    if (update.$set && typeof update.$set === 'object' && !Array.isArray(update.$set)) {
        const setObj = update.$set;
        if ('location' in setObj) {
            setObj.location = normalizeUserLocation(setObj.location);
        }
        if ('mobileVisibility' in setObj) {
            setObj.mobileVisibility = normalizeUserMobileVisibility(setObj.mobileVisibility);
        }
        if ('location.coordinates' in setObj) {
            const nextGeo = toUserGeoPoint(setObj['location.coordinates']);
            if (!nextGeo) {
                delete setObj['location.coordinates'];
            }
            else {
                setObj['location.coordinates'] = nextGeo;
            }
        }
    }
});
exports.User = (0, db_1.getUserConnection)().models.User || (0, db_1.getUserConnection)().model('User', UserSchema);
exports.default = exports.User;
//# sourceMappingURL=User.js.map