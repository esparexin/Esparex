"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const schemaOptions_1 = require("@core/utils/schemaOptions");
const BlockedUserSchema = new mongoose_1.Schema({
    blockerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    blockedId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
BlockedUserSchema.pre('validate', function () {
    if (this.blockerId &&
        this.blockedId &&
        String(this.blockerId) === String(this.blockedId)) {
        throw new Error('Users cannot block themselves.');
    }
});
BlockedUserSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true, name: 'idx_blockeduser_blocker_blocked_unique_idx' });
BlockedUserSchema.index({ blockedId: 1 }, { name: 'idx_blockeduser_blocked_idx' });
(0, schemaOptions_1.applyToJSONTransform)(BlockedUserSchema);
const BlockedUser = (0, db_1.getUserConnection)().models.BlockedUser ||
    (0, db_1.getUserConnection)().model('BlockedUser', BlockedUserSchema);
exports.default = BlockedUser;
//# sourceMappingURL=BlockedUser.js.map