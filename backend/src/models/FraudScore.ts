import mongoose, { Schema, Document, Model } from 'mongoose';
import { getUserConnection } from '../config/db';

export interface IFraudScore extends Document {
    userId: mongoose.Types.ObjectId;
    currentScore: number;
    riskLevel: 'allow' | 'flag' | 'captcha' | 'moderation' | 'block';
    lastUpdated: Date;
    autoActioned: boolean;
    autoActionedAt?: Date;
}

const FraudScoreSchema = new Schema<IFraudScore>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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

FraudScoreSchema.index({ userId: 1 }, { name: 'fraudscore_userId_unique_idx', unique: true });
FraudScoreSchema.index({ riskLevel: 1 }, { name: 'fraudscore_riskLevel_idx' });
FraudScoreSchema.index({ autoActioned: 1, currentScore: -1 }, { name: 'fraudscore_autoaction_score_idx' });

const userConnection = getUserConnection();
const FraudScore: Model<IFraudScore> =
    (userConnection.models.FraudScore as Model<IFraudScore>) ||
    userConnection.model<IFraudScore>('FraudScore', FraudScoreSchema);
export default FraudScore;
