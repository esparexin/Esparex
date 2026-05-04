"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// core/src/models/UserWallet.ts
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const schemaOptions_1 = require("@core/utils/schemaOptions");
const UserWalletSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    adCredits: { type: Number, default: 0 }, // never expires
    monthlyFreeAdsUsed: { type: Number, default: 0 },
    spotlightCredits: { type: Number, default: 0 },
    smartAlertSlots: { type: Number, default: 2 }, // base free
    consumedSlots: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Ad' }],
    lastMonthlyReset: { type: Date }, // for free ad slots logic
}, { timestamps: true });
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
UserWalletSchema.index({ userId: 1 }, { name: 'idx_userwallet_userId_unique_idx', unique: true });
const connection = (0, db_1.getUserConnection)();
const UserWallet = connection.models.UserWallet ||
    connection.model("UserWallet", UserWalletSchema);
(0, schemaOptions_1.applyToJSONTransform)(UserWalletSchema);
exports.default = UserWallet;
//# sourceMappingURL=UserWallet.js.map