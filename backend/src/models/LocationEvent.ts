import { Schema, Document, Model } from 'mongoose';
import { getUserConnection } from '../config/db';
import { applyToJSONTransform } from '../utils/schemaOptions';
import {
    LOCATION_EVENT_REASONS,
    LOCATION_EVENT_SOURCES,
    LocationEventReason,
    LocationEventSource,
} from '../constants/locationEvents';

export interface ILocationEvent extends Document {
    userId?: Schema.Types.ObjectId;
    source: LocationEventSource;
    city: string;
    state: string;
    coordinates?: {
        type: 'Point';
        coordinates: [number, number];
    };
    reason?: LocationEventReason;
    createdAt: Date;
}

// ⚠️ Analytics-only model
// Do NOT use for geospatial queries.
// No 2dsphere index intentionally.
const LocationEventSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        source: { type: String, enum: LOCATION_EVENT_SOURCES, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        coordinates: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number] }
        },
        reason: {
            type: String,
            enum: LOCATION_EVENT_REASONS,
        }
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

LocationEventSchema.index({ userId: 1, createdAt: -1 }, { name: 'idx_locationevent_user_freshness_idx' });

const modelName = 'LocationEvent';
const connection = getUserConnection();
const LocationEvent: Model<ILocationEvent> =
    (connection.models[modelName] as Model<ILocationEvent>) ||
    connection.model<ILocationEvent>(modelName, LocationEventSchema);

applyToJSONTransform(LocationEventSchema);

export default LocationEvent;
