"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const schemaOptions_1 = require("@core/utils/schemaOptions");
const OtpSchema = new mongoose_1.Schema({
    mobile: { type: String, required: true },
    otpHash: { type: String, required: true },
    attempts: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
OtpSchema.index({ mobile: 1 }, { name: 'idx_otp_mobile_idx' });
OtpSchema.index({ expiresAt: 1 }, { name: 'idx_otp_expiresAt_ttl_idx', expireAfterSeconds: 0 });
OtpSchema.index({ mobile: 1, createdAt: -1 }, { name: 'idx_otp_mobile_createdAt_idx' });
(0, schemaOptions_1.applyToJSONTransform)(OtpSchema);
const connection = (0, db_1.getUserConnection)();
const Otp = connection.models.Otp ||
    connection.model('Otp', OtpSchema);
exports.default = Otp;
//# sourceMappingURL=Otp.js.map