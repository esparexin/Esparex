"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const schemaOptions_1 = require("@core/utils/schemaOptions");
const SavedSearchSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    query: { type: String, trim: true, maxlength: 120 },
    categoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category' },
    locationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Location' },
    priceMin: { type: Number, min: 0 },
    priceMax: { type: Number, min: 0 },
    coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number] }
    },
    radiusKm: { type: Number, min: 0, max: 500 },
}, { timestamps: true });
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
SavedSearchSchema.index({ userId: 1 }, { name: 'idx_savedsearch_userId_idx' });
SavedSearchSchema.index({ categoryId: 1 }, { name: 'idx_savedsearch_categoryId_idx' });
SavedSearchSchema.index({ locationId: 1 }, { name: 'idx_savedsearch_locationId_idx' });
SavedSearchSchema.index({ userId: 1, createdAt: -1 }, { name: 'idx_savedsearch_user_freshness_idx' });
SavedSearchSchema.index({ 'coordinates.coordinates': '2dsphere' }, { name: 'idx_savedsearch_coordinates_2dsphere', sparse: true });
(0, schemaOptions_1.applyToJSONTransform)(SavedSearchSchema);
const connection = (0, db_1.getUserConnection)();
const SavedSearch = connection.models.SavedSearch ||
    connection.model('SavedSearch', SavedSearchSchema);
exports.default = SavedSearch;
//# sourceMappingURL=SavedSearch.js.map