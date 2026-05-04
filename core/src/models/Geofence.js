"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const GeofenceSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["Polygon"], default: "Polygon" },
    coordinates: {
        type: {
            type: String,
            enum: ["Polygon"],
            required: true
        },
        coordinates: {
            type: [[[Number]]],
            required: true
        }
    },
    color: { type: String, default: "#16a34a" },
    isActive: { type: Boolean, default: true },
    metadata: { type: mongoose_1.Schema.Types.Mixed, default: {} }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: function (_doc, ret) {
            const rawId = ret._id;
            if (typeof rawId === 'string' || (rawId && typeof rawId.toString === 'function')) {
                ret.id = rawId.toString();
            }
            delete ret._id;
            return ret;
        }
    }
});
GeofenceSchema.index({ "coordinates": "2dsphere" }, { name: 'idx_geofence_geo_2dsphere' });
const connection = (0, db_1.getUserConnection)();
const Geofence = connection.models.Geofence ||
    connection.model("Geofence", GeofenceSchema);
exports.default = Geofence;
//# sourceMappingURL=Geofence.js.map