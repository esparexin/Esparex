"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const AlertDeliveryLogSchema = new mongoose_1.Schema({
    alertId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'SmartAlert', required: true },
    adId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Ad', required: true },
    deliveredAt: { type: Date, default: Date.now }
}, { timestamps: false });
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
AlertDeliveryLogSchema.index({ deliveredAt: 1 }, { name: 'idx_alertlog_deliveredAt_ttl_idx', expireAfterSeconds: 60 * 60 * 24 * 7 });
AlertDeliveryLogSchema.index({ alertId: 1, adId: 1 }, { name: 'idx_alertlog_alert_ad_unique_idx', unique: true });
const modelName = 'AlertDeliveryLog';
const connection = (0, db_1.getUserConnection)();
const AlertDeliveryLog = connection.models[modelName] ||
    connection.model(modelName, AlertDeliveryLogSchema);
exports.default = AlertDeliveryLog;
//# sourceMappingURL=AlertDeliveryLog.js.map