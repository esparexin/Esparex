import mongoose, { Schema, Document, Model } from 'mongoose';
import { REPORT_STATUS, REPORT_STATUS_VALUES, ReportStatusValue } from '@shared/enums/reportStatus';
import { REPORT_REASON_VALUES, ReportReasonValue } from '@shared/enums/reportReason';

export const REPORT_TARGET_TYPE_VALUES = ['ad', 'chat', 'user', 'business'] as const;
export type ReportTargetTypeValue = (typeof REPORT_TARGET_TYPE_VALUES)[number];

export interface IReport extends Document {
    targetType: ReportTargetTypeValue;
    targetId: mongoose.Types.ObjectId;
    reporterId: mongoose.Types.ObjectId;
    adId?: mongoose.Types.ObjectId;
    adTitle?: string;
    reportedBy?: mongoose.Types.ObjectId;
    reason: ReportReasonValue;
    description?: string;
    additionalDetails?: string;
    status: ReportStatusValue;
    resolvedAt?: Date;
    resolvedBy?: mongoose.Types.ObjectId;
    resolution?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ReportSchema: Schema = new Schema({
    targetType: { type: String, enum: REPORT_TARGET_TYPE_VALUES, required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    adId: { type: Schema.Types.ObjectId, ref: 'Ad' },
    adTitle: { type: String },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reason: {
        type: String,
        required: true,
        enum: REPORT_REASON_VALUES
    },
    description: { type: String },
    additionalDetails: { type: String },
    status: {
        type: String,
        enum: REPORT_STATUS_VALUES,
        default: REPORT_STATUS.OPEN
    },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolution: { type: String }
}, { timestamps: true });

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

ReportSchema.index({ status: 1 }, { name: 'report_status_idx' });
ReportSchema.index({ adId: 1 }, { name: 'report_adId_idx' });
ReportSchema.index({ reportedBy: 1 }, { name: 'report_reportedBy_idx' });
ReportSchema.index({ targetType: 1, status: 1, createdAt: -1 }, { name: 'report_targetType_status_createdAt_idx' });
ReportSchema.index({ targetId: 1, targetType: 1, status: 1 }, { name: 'report_targetId_targetType_status_idx' });
ReportSchema.index({ resolvedBy: 1 }, { name: 'report_resolvedBy_idx' });
ReportSchema.index({ status: 1, createdAt: -1 }, { name: 'report_status_freshness_idx' });
ReportSchema.index({ adId: 1, status: 1, createdAt: -1 }, { name: 'report_ad_status_freshness_idx' });

// 🔒 DEDUP CONSTRAINT: one active report per user per ad at DB level.
// Prevents race conditions where concurrent requests bypass the controller findOne check.
ReportSchema.index(
    { adId: 1, reportedBy: 1 },
    {
        name: 'report_adId_reporter_dedup_idx',
        unique: true,
        partialFilterExpression: {
            status: { $in: ['open', 'pending', 'reviewed'] },
            adId: { $exists: true },
            reportedBy: { $exists: true }
        }
    }
);

ReportSchema.index(
    { targetType: 1, targetId: 1, reporterId: 1 },
    {
        name: 'report_target_reporter_dedup_idx',
        unique: true,
        partialFilterExpression: {
            status: { $in: ['open', 'pending', 'reviewed'] },
            targetType: { $exists: true },
            targetId: { $exists: true },
            reporterId: { $exists: true }
        }
    }
);

// toJSON Transform - Convert _id to id
ReportSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (_doc, ret) {
        const json = ret as Record<string, unknown> & { _id?: { toString(): string }; id?: string };
        json.id = json._id?.toString();
        delete json._id;
        return json;
    }
});

import { getUserConnection } from '../config/db';
const Report: Model<IReport> = getUserConnection().models.Report || getUserConnection().model<IReport>('Report', ReportSchema);

export default Report;
