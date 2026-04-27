"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const SellerReputationSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    adsPosted: { type: Number, default: 0, min: 0 },
    responseRate: { type: Number, default: 0, min: 0, max: 1 },
    averageResponseTime: { type: Number, default: 0, min: 0 }, // milliseconds
    score: { type: Number, default: 0, min: 0, max: 5 },
}, { timestamps: true });
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
SellerReputationSchema.index({ userId: 1 }, { name: 'idx_sellerreputation_userId_unique_idx', unique: true });
SellerReputationSchema.index({ score: -1 }, { name: 'idx_sellerreputation_score_idx' });
const connection = (0, db_1.getUserConnection)();
const SellerReputation = connection.models.SellerReputation ||
    connection.model('SellerReputation', SellerReputationSchema);
exports.default = SellerReputation;
//# sourceMappingURL=SellerReputation.js.map