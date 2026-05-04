"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schemaOptions_1 = require("@core/utils/schemaOptions");
const SavedAdSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    adId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Ad', required: true },
}, { timestamps: true });
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
SavedAdSchema.index({ userId: 1, adId: 1 }, { name: 'idx_savedad_user_ad_unique_idx', unique: true });
// Covers getSavedAds sorted pagination: find({ userId }).sort({ createdAt: -1 })
SavedAdSchema.index({ userId: 1, createdAt: -1 }, { name: 'idx_savedad_userId_createdAt_desc' });
(0, schemaOptions_1.applyToJSONTransform)(SavedAdSchema);
const db_1 = require("@core/config/db");
const SavedAd = (0, db_1.getUserConnection)().models.SavedAd || (0, db_1.getUserConnection)().model('SavedAd', SavedAdSchema);
exports.default = SavedAd;
//# sourceMappingURL=SavedAd.js.map