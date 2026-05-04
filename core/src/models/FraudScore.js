"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const FraudScoreSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    currentScore: { type: Number, required: true, default: 0 },
    riskLevel: {
        type: String,
        required: true,
        enum: ['allow', 'flag', 'captcha', 'moderation', 'block'],
        default: 'allow'
    },
    lastUpdated: { type: Date, default: Date.now },
    autoActioned: { type: Boolean, default: false },
    autoActionedAt: { type: Date }
});
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
FraudScoreSchema.index({ userId: 1 }, { name: 'idx_fraudscore_userId_unique_idx', unique: true });
FraudScoreSchema.index({ riskLevel: 1 }, { name: 'idx_fraudscore_riskLevel_idx' });
FraudScoreSchema.index({ autoActioned: 1, currentScore: -1 }, { name: 'idx_fraudscore_autoaction_score_idx' });
const userConnection = (0, db_1.getUserConnection)();
const FraudScore = userConnection.models.FraudScore ||
    userConnection.model('FraudScore', FraudScoreSchema);
exports.default = FraudScore;
//# sourceMappingURL=FraudScore.js.map