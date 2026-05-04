"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const DuplicateEventSchema = new mongoose_1.Schema({
    sellerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    adId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Ad' },
    matchedAdId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Ad' },
    action: {
        type: String,
        enum: ['blocked', 'flagged', 'bypass_allowed'],
        required: true
    },
    reason: { type: String, required: true },
    score: { type: Number, min: 0, max: 100 },
    duplicateFingerprint: { type: String },
    details: { type: mongoose_1.Schema.Types.Mixed },
}, { timestamps: true });
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
DuplicateEventSchema.index({ sellerId: 1 }, { name: 'idx_duplicateevent_sellerId_idx' });
DuplicateEventSchema.index({ action: 1 }, { name: 'idx_duplicateevent_action_idx' });
DuplicateEventSchema.index({ duplicateFingerprint: 1 }, { name: 'idx_duplicateevent_fingerprint_idx' });
DuplicateEventSchema.index({ createdAt: -1 }, { name: 'idx_duplicateevent_createdAt_idx' });
DuplicateEventSchema.index({ sellerId: 1, createdAt: -1 }, { name: 'idx_duplicateevent_seller_date_idx' });
DuplicateEventSchema.index({ action: 1, createdAt: -1 }, { name: 'idx_duplicateevent_action_date_idx' });
DuplicateEventSchema.index({ adId: 1, createdAt: -1 }, { name: 'idx_duplicateevent_adId_idx' });
DuplicateEventSchema.index({ matchedAdId: 1, createdAt: -1 }, { name: 'idx_duplicateevent_matchedAdId_idx' });
const modelName = 'DuplicateEvent';
const connection = (0, db_1.getAdminConnection)();
const DuplicateEvent = connection.models[modelName] ||
    connection.model(modelName, DuplicateEventSchema);
exports.default = DuplicateEvent;
//# sourceMappingURL=DuplicateEvent.js.map