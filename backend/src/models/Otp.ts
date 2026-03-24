import { Schema, Document, Model } from 'mongoose';
import { getUserConnection } from '../config/db';

export interface IOtp extends Document {
    mobile: string;
    otpHash: string;
    attempts: number;
    expiresAt: Date;

    createdAt: Date;
}

const OtpSchema = new Schema<IOtp>({
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
// toJSON Transform - Convert _id to id
OtpSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (_doc: unknown, ret: unknown) {
        const json = ret as unknown as Record<string, unknown> & { _id?: { toString(): string }; id?: string };
        json.id = json._id?.toString();
        delete json._id;
        return json;
    }
});

const connection = getUserConnection();
const Otp: Model<IOtp> =
    (connection.models.Otp as Model<IOtp>) ||
    connection.model<IOtp>('Otp', OtpSchema);

export default Otp;
