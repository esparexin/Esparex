"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const actor_1 = require("@core/constants/enums/actor");
const StatusHistorySchema = new mongoose_1.Schema({
    domain: { type: String, enum: ['ad', 'user', 'business', 'service'], required: true },
    entityId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    fromStatus: { type: String, required: true },
    toStatus: { type: String, required: true },
    actorType: { type: String, enum: actor_1.ACTOR_TYPE_VALUES, required: true },
    actorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, trim: true },
    metadata: { type: mongoose_1.Schema.Types.Mixed }
}, { timestamps: true });
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
StatusHistorySchema.index({ domain: 1 }, { name: 'idx_statushistory_domain_idx' });
StatusHistorySchema.index({ entityId: 1 }, { name: 'idx_statushistory_entityId_idx' });
StatusHistorySchema.index({ actorType: 1 }, { name: 'idx_statushistory_actorType_idx' });
StatusHistorySchema.index({ actorId: 1 }, { name: 'idx_statushistory_actorId_idx' });
StatusHistorySchema.index({ entityId: 1, domain: 1, createdAt: -1 }, { name: 'idx_statushistory_entity_domain_freshness_idx' });
StatusHistorySchema.index({ domain: 1, toStatus: 1, createdAt: -1 }, { name: 'idx_statushistory_domain_status_freshness_idx' });
StatusHistorySchema.index({ actorId: 1, createdAt: -1 }, { name: 'idx_statushistory_actor_freshness_idx' });
const connection = (0, db_1.getUserConnection)();
const StatusHistory = connection.models.StatusHistory ||
    connection.model('StatusHistory', StatusHistorySchema);
exports.default = StatusHistory;
//# sourceMappingURL=StatusHistory.js.map