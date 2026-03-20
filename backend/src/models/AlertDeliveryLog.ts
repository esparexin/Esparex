import { Schema, Document } from 'mongoose';
import { getUserConnection } from '../config/db';

export interface IAlertDeliveryLog extends Document {
    alertId: Schema.Types.ObjectId;
    adId: Schema.Types.ObjectId;
    deliveredAt: Date;
}

const AlertDeliveryLogSchema: Schema = new Schema({
    alertId: { type: Schema.Types.ObjectId, ref: 'SmartAlert', required: true },
    adId: { type: Schema.Types.ObjectId, ref: 'Ad', required: true },
    deliveredAt: { type: Date, default: Date.now }
}, { timestamps: false });

// TTL Index: We only need to store these logs for a while to prevent immediate re-notification.
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

AlertDeliveryLogSchema.index({ deliveredAt: 1 }, { name: 'alertlog_deliveredAt_ttl_idx', expireAfterSeconds: 60 * 60 * 24 * 7 });
AlertDeliveryLogSchema.index({ alertId: 1, adId: 1 }, { name: 'alertlog_alert_ad_unique_idx', unique: true });

export default getUserConnection().models.AlertDeliveryLog || getUserConnection().model<IAlertDeliveryLog>('AlertDeliveryLog', AlertDeliveryLogSchema);
