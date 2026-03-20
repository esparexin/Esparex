import { Schema, Document, Model } from 'mongoose';
import { getUserConnection } from '../config/db';
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

LocationEventSchema.index({ userId: 1, createdAt: -1 }, { name: 'locevent_user_freshness_idx' });

const LocationEvent: Model<ILocationEvent> =
    getUserConnection().models.LocationEvent ||
    getUserConnection().model<ILocationEvent>('LocationEvent', LocationEventSchema);

// toJSON Transform - Convert _id to id
LocationEventSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (_doc, ret) {
        const json = ret as Record<string, unknown> & { _id?: { toString(): string }; id?: string };
        json.id = json._id?.toString();
        delete json._id;
        return json;
    }
});

export default LocationEvent;
