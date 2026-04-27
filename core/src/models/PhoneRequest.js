"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const requestStatus_1 = require("@core/constants/enums/requestStatus");
const PhoneRequestSchema = new mongoose_1.Schema({
    buyerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    entityId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    entityType: { type: String, enum: ['ad', 'service'], required: true },
    status: {
        type: String,
        enum: requestStatus_1.REQUEST_STATUS_VALUES,
        default: requestStatus_1.REQUEST_STATUS.PENDING
    }
}, { timestamps: true });
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
PhoneRequestSchema.index({ buyerId: 1 }, { name: 'idx_phonereq_buyerId_idx' });
PhoneRequestSchema.index({ sellerId: 1 }, { name: 'idx_phonereq_sellerId_idx' });
PhoneRequestSchema.index({ entityId: 1 }, { name: 'idx_phonereq_entityId_idx' });
PhoneRequestSchema.index({ status: 1 }, { name: 'idx_phonereq_status_idx' });
PhoneRequestSchema.index({ buyerId: 1, sellerId: 1, entityId: 1 }, { name: 'idx_phonereq_buyer_seller_entity_unique_idx', unique: true });
const db_1 = require("@core/config/db");
const schemaOptions_1 = require("@core/utils/schemaOptions");
(0, schemaOptions_1.applyToJSONTransform)(PhoneRequestSchema);
const PhoneRequest = (0, db_1.getUserConnection)().models.PhoneRequest || (0, db_1.getUserConnection)().model('PhoneRequest', PhoneRequestSchema);
exports.default = PhoneRequest;
//# sourceMappingURL=PhoneRequest.js.map