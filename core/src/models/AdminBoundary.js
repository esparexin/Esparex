"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const locationInputNormalizer_1 = require("@core/utils/locationInputNormalizer");
const AdminBoundarySchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    level: {
        type: String,
        required: true,
        enum: locationInputNormalizer_1.LOCATION_LEVELS
    },
    locationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Location',
        required: true
    },
    geometry: {
        type: {
            type: String,
            required: true,
            enum: ['Polygon', 'MultiPolygon']
        },
        coordinates: {
            type: mongoose_1.Schema.Types.Mixed,
            required: true
        }
    }
}, {
    timestamps: true
});
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
AdminBoundarySchema.index({ level: 1 }, { name: 'idx_adminboundary_level_idx' });
AdminBoundarySchema.index({ locationId: 1 }, { name: 'idx_adminboundary_locationId_idx' });
AdminBoundarySchema.index({ geometry: '2dsphere' }, { name: 'idx_adminboundary_geo_2dsphere' });
AdminBoundarySchema.index({ locationId: 1, level: 1 }, { name: 'idx_adminboundary_location_level_unique_idx', unique: true });
const connection = (0, db_1.getUserConnection)();
const AdminBoundary = connection.models.AdminBoundary ||
    connection.model('AdminBoundary', AdminBoundarySchema);
exports.default = AdminBoundary;
//# sourceMappingURL=AdminBoundary.js.map