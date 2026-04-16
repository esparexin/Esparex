import { Schema, Model, Types } from "mongoose";
import { getUserConnection } from "../config/db";

export interface IGeofence {
    _id: Types.ObjectId;
    name: string;
    type: "Polygon";
    coordinates: {
        type: "Polygon";
        coordinates: number[][][]; // For Polygon: number[][][]
    };
    color: string;
    isActive: boolean;
    metadata?: Record<string, unknown>;
    createdAt?: Date;
    updatedAt?: Date;
}

const GeofenceSchema = new Schema<IGeofence>(
    {
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
        metadata: { type: Schema.Types.Mixed, default: {} }
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: function (_doc: unknown, ret: Record<string, unknown>) {
                const rawId = ret._id;
                if (typeof rawId === 'string' || (rawId && typeof (rawId as { toString?: () => string }).toString === 'function')) {
                    ret.id = rawId.toString();
                }
                delete ret._id;
                return ret;
            }
        }
    }
);

GeofenceSchema.index({ "coordinates": "2dsphere" }, { name: 'idx_geofence_geo_2dsphere' });

const connection = getUserConnection();
const Geofence: Model<IGeofence> =
    (connection.models.Geofence as Model<IGeofence> | undefined) ||
    connection.model<IGeofence>("Geofence", GeofenceSchema);

export default Geofence;
