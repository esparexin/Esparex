"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const softDeletePlugin_1 = __importDefault(require("@core/utils/softDeletePlugin"));
const geoUtils_1 = require("@shared/utils/geoUtils");
const locationPrimitives_1 = require("@core/utils/locationPrimitives");
const locationStatus_1 = require("@core/constants/enums/locationStatus");
/* -------------------------------------------------------------------------- */
/* SCHEMA                                                                     */
/* -------------------------------------------------------------------------- */
const LocationSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true },
    normalizedName: { type: String, trim: true },
    country: { type: String, default: "Unknown", trim: true },
    level: {
        type: String,
        enum: locationPrimitives_1.LOCATION_LEVELS,
        default: "city"
    },
    // Canonical hierarchy linkage (SSOT tree)
    parentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Location",
        default: null
    },
    path: {
        type: [mongoose_1.Schema.Types.ObjectId],
        default: [],
    },
    coordinates: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
        },
        coordinates: {
            type: [Number],
            required: true,
            validate: {
                validator: (coords) => (0, geoUtils_1.hasValidCoordinateArray)(coords),
                message: "Valid [longitude, latitude] coordinates are required and cannot be [0,0]."
            },
        },
    },
    isActive: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    verificationStatus: {
        type: String,
        enum: locationStatus_1.LOCATION_STATUS_VALUES,
        default: locationStatus_1.LOCATION_STATUS.PENDING
    },
    requestedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    // Ranking & Search
    priority: { type: Number, default: 0 }, // 1000=Metro, 0=Default
    tier: { type: Number, default: 3 }, // 1=Tier1, 2=Tier2, 3=Tier3
    aliases: { type: [String], default: [] }, // ["Bombay"] for Mumbai
}, {
    timestamps: true,
    minimize: false,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: function (_doc, ret) {
            const json = ret;
            json.id = String(json._id);
            delete json._id;
            return json;
        }
    },
    toObject: { virtuals: true, versionKey: false },
});
// Pre-save hook for slugification
LocationSchema.pre("save", function () {
    this.coordinates = (0, geoUtils_1.sanitizeGeoPoint)(this.coordinates);
    if (this.name) {
        this.normalizedName = (0, locationPrimitives_1.normalizeLocationNameForSearch)(this.name);
    }
    if (!this.slug) {
        // Use name + country only — city/state are deprecated flat fields (Sprint 3 removal)
        this.slug = (0, locationPrimitives_1.buildLocationSlug)(this.name, this.country || "unknown");
    }
});
LocationSchema.pre("findOneAndUpdate", function () {
    const update = this.getUpdate();
    if (!update)
        return;
    if ('coordinates' in update) {
        update.coordinates = (0, geoUtils_1.sanitizeGeoPoint)(update.coordinates);
    }
    if (update.$set && typeof update.$set === 'object') {
        const setObj = update.$set;
        if ('coordinates' in setObj) {
            setObj.coordinates = (0, geoUtils_1.sanitizeGeoPoint)(setObj.coordinates);
        }
        if ('coordinates.coordinates' in setObj) {
            const nextGeo = (0, geoUtils_1.sanitizeGeoPoint)({
                type: 'Point',
                coordinates: setObj['coordinates.coordinates']
            });
            if (!nextGeo) {
                delete setObj['coordinates.coordinates'];
            }
        }
    }
    const target = (update.$set && typeof update.$set === "object" ? update.$set : update);
    const nextName = typeof target.name === "string" ? target.name : undefined;
    const nextCountry = typeof target.country === "string" ? target.country : undefined;
    if (nextName) {
        target.normalizedName = (0, locationPrimitives_1.normalizeLocationNameForSearch)(nextName);
    }
    // Slug uses name + country only — city/state are deprecated flat fields (Sprint 3 removal)
    if (!target.slug && nextName) {
        target.slug = (0, locationPrimitives_1.buildLocationSlug)(nextName, nextCountry || "Unknown");
    }
});
LocationSchema.plugin(softDeletePlugin_1.default);
/* -------------------------------------------------------------------------- */
/* INDEXES (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
// Geo index (MANDATORY for $geoNear) - compounded with common filters for efficiency
LocationSchema.index({ coordinates: "2dsphere", isActive: 1, level: 1 }, { name: 'idx_location_geo_coordinates_2dsphere' });
// Text index for broad keyword matching (city/state fields removed in Sprint 3)
LocationSchema.index({ name: "text", normalizedName: "text", aliases: "text" }, { name: 'idx_location_text_search_v2' });
// Standalone indexes for efficient Regex Autocomplete (/^query/)
LocationSchema.index({ level: 1 }, { name: 'idx_location_level' });
LocationSchema.index({ parentId: 1 }, { name: 'idx_location_parentId' });
LocationSchema.index({ isActive: 1 }, { name: 'idx_location_isActive' });
LocationSchema.index({ isPopular: 1 }, { name: 'idx_location_isPopular' });
LocationSchema.index({ verificationStatus: 1 }, { name: 'idx_location_verificationStatus' });
LocationSchema.index({ priority: -1 }, { name: 'idx_location_priority' });
LocationSchema.index({ aliases: 1 }, { name: 'idx_location_aliases' });
LocationSchema.index({ country: 1 }, { name: 'idx_location_country' });
LocationSchema.index({ slug: 1 }, { name: 'idx_location_slug' });
LocationSchema.index({ path: 1 }, { name: 'idx_location_path' });
LocationSchema.index({ requestedBy: 1 }, { name: 'idx_location_requestedBy' });
LocationSchema.index({ isActive: 1, level: 1, parentId: 1 }, { name: 'idx_location_active_level_parent' });
LocationSchema.index({ isActive: 1, level: 1, path: 1 }, { name: 'idx_location_active_level_path' });
LocationSchema.index({ isPopular: -1, priority: -1 }, { name: 'idx_location_popular_priority' });
LocationSchema.index({ normalizedName: 1 }, { name: 'idx_location_normalizedName' });
// Compound indexes for admin filters + pagination/sorting paths
LocationSchema.index({ level: 1, isActive: 1 }, { name: 'idx_location_level_active' });
LocationSchema.index({ verificationStatus: 1, createdAt: 1 }, { name: 'idx_location_verificationStatus_createdAt' });
LocationSchema.index({ isActive: 1, isPopular: -1, createdAt: -1 }, { name: 'idx_location_active_popular_freshness' });
LocationSchema.index({ country: 1, level: 1, parentId: 1 }, { name: 'idx_location_country_level_parent' });
LocationSchema.index({ isDeleted: 1 }, { name: 'idx_location_isDeleted' });
// Uniqueness guard (real-world safe)
LocationSchema.index({
    name: 1,
    country: 1,
    level: 1,
    parentId: 1,
}, {
    name: 'idx_location_unique_identity',
    unique: true,
    partialFilterExpression: { isDeleted: false }
});
/* -------------------------------------------------------------------------- */
/* MODEL EXPORT                                                               */
/* -------------------------------------------------------------------------- */
const connection = (0, db_1.getUserConnection)();
const Location = connection.models.Location ||
    connection.model("Location", LocationSchema);
exports.default = Location;
//# sourceMappingURL=Location.js.map