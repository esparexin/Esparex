import { Schema, Model, Types } from "mongoose";
import { getUserConnection } from "../config/db";
import softDeletePlugin, { ISoftDeleteDocument } from "../utils/softDeletePlugin";
import { hasValidCoordinateArray, sanitizeGeoPoint } from "../../../shared/utils/geoUtils";
import { LOCATION_LEVELS, buildLocationSlug, normalizeLocationNameForSearch } from "../utils/locationInputNormalizer";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

export interface ILocation extends ISoftDeleteDocument {
    _id: Types.ObjectId;

    name: string;
    slug: string; // URL-safe unique identifier
    country: string;
    softDelete(): Promise<this>;
    restore(): Promise<this>;

    level: "country" | "state" | "district" | "city" | "area" | "village";
    parentId?: Types.ObjectId | null;
    path: Types.ObjectId[];
    normalizedName?: string;

    coordinates: {
        type: "Point";
        coordinates: [number, number]; // [lng, lat]
    };

    isActive: boolean;
    isPopular: boolean;
    verificationStatus: "pending" | "verified" | "rejected";
    requestedBy?: Types.ObjectId;

    priority: number;
    tier: number;
    aliases: string[];

    createdAt?: Date;
    updatedAt?: Date;
}

/* -------------------------------------------------------------------------- */
/* SCHEMA                                                                     */
/* -------------------------------------------------------------------------- */

const LocationSchema = new Schema<ILocation>(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, trim: true },
        normalizedName: { type: String, trim: true },

        country: { type: String, default: "Unknown", trim: true },

        level: {
            type: String,
            enum: LOCATION_LEVELS,
            default: "city"
        },
        // Canonical hierarchy linkage (SSOT tree)
        parentId: {
            type: Schema.Types.ObjectId,
            ref: "Location",
            default: null
        },
        path: {
            type: [Schema.Types.ObjectId],
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
                    validator: (coords: number[]) => hasValidCoordinateArray(coords),
                    message: "Valid [longitude, latitude] coordinates are required and cannot be [0,0]."
                },
            },
        },

        isActive: { type: Boolean, default: true },
        isPopular: { type: Boolean, default: false },
        verificationStatus: {
            type: String,
            enum: ["pending", "verified", "rejected"],
            default: "pending"
        },
        requestedBy: { type: Schema.Types.ObjectId, ref: "User" },

        // Ranking & Search
        priority: { type: Number, default: 0 }, // 1000=Metro, 0=Default
        tier: { type: Number, default: 3 }, // 1=Tier1, 2=Tier2, 3=Tier3
        aliases: { type: [String], default: [] }, // ["Bombay"] for Mumbai
    },
    {
        timestamps: true,
        minimize: false,
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: function (_doc: unknown, ret: unknown) {
                const json = ret as Record<string, unknown>;
                json.id = String(json._id);
                delete json._id;
                return json;
            }
        },
        toObject: { virtuals: true, versionKey: false },
    }
);

// Pre-save hook for slugification
LocationSchema.pre("save", async function () {
    this.coordinates = sanitizeGeoPoint(this.coordinates) as ILocation['coordinates'];

    if (this.name) {
        this.normalizedName = normalizeLocationNameForSearch(this.name);
    }
    if (!this.slug) {
        // Use name + country only — city/state are deprecated flat fields (Sprint 3 removal)
        this.slug = buildLocationSlug(this.name, this.name, this.country || "unknown");
    }
});

LocationSchema.pre("findOneAndUpdate", function () {
    const update = this.getUpdate() as Record<string, unknown> | undefined;
    if (!update) return;

    if ('coordinates' in update) {
        update.coordinates = sanitizeGeoPoint(update.coordinates);
    }

    if (update.$set && typeof update.$set === 'object') {
        const setObj = update.$set as Record<string, unknown>;
        if ('coordinates' in setObj) {
            setObj.coordinates = sanitizeGeoPoint(setObj.coordinates);
        }
        if ('coordinates.coordinates' in setObj) {
            const nextGeo = sanitizeGeoPoint({
                type: 'Point',
                coordinates: setObj['coordinates.coordinates']
            });
            if (!nextGeo) {
                delete setObj['coordinates.coordinates'];
            }
        }
    }

    const target = (update.$set && typeof update.$set === "object" ? update.$set : update) as Record<string, unknown>;
    const nextName = typeof target.name === "string" ? target.name : undefined;
    const nextCountry = typeof target.country === "string" ? target.country : undefined;

    if (nextName) {
        target.normalizedName = normalizeLocationNameForSearch(nextName);
    }
    // Slug uses name + country only — city/state are deprecated flat fields (Sprint 3 removal)
    if (!target.slug && nextName) {
        target.slug = buildLocationSlug(nextName, nextName, nextCountry || "Unknown");
    }
});

LocationSchema.plugin(softDeletePlugin);

/* -------------------------------------------------------------------------- */
/* INDEXES (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

// Geo index (MANDATORY for $geoNear)
LocationSchema.index({ coordinates: "2dsphere" }, { name: 'idx_location_geo_coordinates_2dsphere' });

// Text index for broad keyword matching (city/state fields removed in Sprint 3)
LocationSchema.index(
    { name: "text", normalizedName: "text", aliases: "text" },
    { name: 'idx_location_text_search_v2' }
);

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
LocationSchema.index(
    {
        name: 1,
        country: 1,
        level: 1,
        parentId: 1,
    },
    {
        name: 'idx_location_unique_identity',
        unique: true,
        partialFilterExpression: { isDeleted: false }
    }
);

/* -------------------------------------------------------------------------- */
/* MODEL EXPORT                                                               */
/* -------------------------------------------------------------------------- */

const connection = getUserConnection();

const Location: Model<ILocation> =
    connection.models.Location ||
    connection.model<ILocation>("Location", LocationSchema);

export default Location;
