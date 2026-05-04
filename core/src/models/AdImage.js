"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const AdImageSchema = new mongoose_1.Schema({
    adId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Ad', required: true },
    imageUrl: { type: String, required: true },
    thumbnailUrl: { type: String },
    imageHash: { type: String, required: true },
}, {
    timestamps: true
});
// CRITICAL: Prevent duplicate images per Ad at the database level
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
AdImageSchema.index({ adId: 1 }, { name: 'idx_adimage_adId_idx' });
AdImageSchema.index({ imageHash: 1 }, { name: 'idx_adimage_imageHash_idx' });
AdImageSchema.index({ adId: 1, imageHash: 1 }, { name: 'idx_adimage_adId_hash_unique_idx', unique: true });
const AdImage = (0, db_1.getUserConnection)().models.AdImage || (0, db_1.getUserConnection)().model('AdImage', AdImageSchema);
exports.default = AdImage;
//# sourceMappingURL=AdImage.js.map