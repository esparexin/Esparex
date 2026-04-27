"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const BoostSchema = new mongoose_1.Schema({
    entityId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    entityType: { type: String, enum: ['ad', 'service', 'part'], required: true },
    boostType: {
        type: String,
        enum: ['spotlight_hp', 'spotlight_cat', 'push_to_top'],
        required: true
    },
    startsAt: { type: Date, default: Date.now },
    endsAt: { type: Date, required: true },
    transactionId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Transaction' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });
// TTL Index to automatically mark as inactive or handle cleanup if needed
// However, visibility logic should just check current date vs startsAt/endsAt
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
BoostSchema.index({ entityId: 1 }, { name: 'idx_boost_entityId_idx' });
BoostSchema.index({ startsAt: 1 }, { name: 'idx_boost_startsAt_idx' });
BoostSchema.index({ isActive: 1 }, { name: 'idx_boost_isActive_idx' });
BoostSchema.index({ endsAt: 1 }, { name: 'idx_boost_endsAt_idx', expireAfterSeconds: 0 });
BoostSchema.index({ transactionId: 1 }, { name: 'idx_boost_transactionId_idx' });
const db_1 = require("@core/config/db");
const schemaOptions_1 = require("@core/utils/schemaOptions");
const Boost = (0, db_1.getUserConnection)().models.Boost || (0, db_1.getUserConnection)().model('Boost', BoostSchema);
(0, schemaOptions_1.applyToJSONTransform)(BoostSchema);
exports.default = Boost;
//# sourceMappingURL=Boost.js.map