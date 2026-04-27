"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const schemaOptions_1 = require("@core/utils/schemaOptions");
const locationEvents_1 = require("@core/constants/locationEvents");
// ⚠️ Analytics-only model
// Do NOT use for geospatial queries.
// No 2dsphere index intentionally.
const LocationEventSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    source: { type: String, enum: locationEvents_1.LOCATION_EVENT_SOURCES, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number] }
    },
    reason: {
        type: String,
        enum: locationEvents_1.LOCATION_EVENT_REASONS,
    }
}, { timestamps: { createdAt: true, updatedAt: false } });
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
LocationEventSchema.index({ userId: 1, createdAt: -1 }, { name: 'idx_locationevent_user_freshness_idx' });
const modelName = 'LocationEvent';
const connection = (0, db_1.getAdminConnection)();
const LocationEvent = connection.models[modelName] ||
    connection.model(modelName, LocationEventSchema);
(0, schemaOptions_1.applyToJSONTransform)(LocationEventSchema);
exports.default = LocationEvent;
//# sourceMappingURL=LocationEvent.js.map