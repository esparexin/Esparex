import { Schema, Document } from 'mongoose';
import { getAdminConnection } from '../config/db';
import { applyToJSONTransform } from '../utils/schemaOptions';

export interface IJobLog extends Document {
    jobName: string;
    status: 'started' | 'success' | 'failed';
    result?: unknown;
    error?: string;
    durationMs?: number;
    triggeredBy?: string; // 'cron' | 'manual'
    startedAt: Date;
    completedAt?: Date;
}

const JobLogSchema: Schema = new Schema({
    jobName: { type: String, required: true },
    status: { type: String, enum: ['started', 'success', 'failed'], required: true },
    result: { type: Schema.Types.Mixed },
    error: { type: String },
    durationMs: { type: Number },
    triggeredBy: { type: String, default: 'cron' },
    startedAt: { type: Date, required: true, default: Date.now },
    completedAt: { type: Date }
}, {
    expireAfterSeconds: 60 * 60 * 24 * 30 // Auto-delete logs after 30 days
});

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

JobLogSchema.index({ jobName: 1 }, { name: 'idx_joblog_name_idx' });
JobLogSchema.index({ status: 1 }, { name: 'idx_joblog_status_idx' });
JobLogSchema.index({ startedAt: -1 }, { name: 'idx_joblog_startedAt_idx' });

applyToJSONTransform(JobLogSchema);

export default getAdminConnection().models.JobLog || getAdminConnection().model<IJobLog>('JobLog', JobLogSchema);
