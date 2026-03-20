import { Schema, Document } from 'mongoose';
import { getAdminConnection } from '../config/db';

export interface IAdminMetrics extends Document {
    metricModule: string;
    aggregationDate: Date;
    payload: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const AdminMetricsSchema: Schema = new Schema({
    metricModule: { type: String, required: true },
    aggregationDate: { type: Date, required: true },
    payload: { type: Schema.Types.Mixed, required: true }
}, {
    timestamps: true
});

// Compound index for fast retrieval of the latest metrics per module
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

AdminMetricsSchema.index({ metricModule: 1 }, { name: 'adminmetrics_module_idx' });
AdminMetricsSchema.index({ aggregationDate: 1 }, { name: 'adminmetrics_date_idx' });
AdminMetricsSchema.index({ metricModule: 1, aggregationDate: -1 }, { name: 'adminmetrics_module_date_idx' });

export const AdminMetrics = getAdminConnection().model<IAdminMetrics>('AdminMetrics', AdminMetricsSchema);
export default AdminMetrics;
