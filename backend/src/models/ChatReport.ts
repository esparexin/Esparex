import { Schema, Document, Model, Types } from 'mongoose';
import { getUserConnection } from '../config/db';
import {
  CHAT_REPORT_STATUS,
  CHAT_REPORT_STATUS_VALUES,
  type ChatReportStatusValue,
  CHAT_REPORT_REASON_VALUES,
  type ChatReportReasonValue,
} from '@shared/enums/chatStatus';

/* -------------------------------------------------------------------------- */
/* Interface                                                                   */
/* -------------------------------------------------------------------------- */

export interface IChatReport extends Document {
  conversationId: Types.ObjectId;
  reporterId: Types.ObjectId;
  reportedUserId: Types.ObjectId;
  messageId?: Types.ObjectId;

  reason: ChatReportReasonValue;
  description?: string;

  status: ChatReportStatusValue;
  adminAction?: string;
  resolvedAt?: Date;
  resolvedBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

/* -------------------------------------------------------------------------- */
/* Schema                                                                      */
/* -------------------------------------------------------------------------- */

const ChatReportSchema = new Schema<IChatReport>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reportedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    messageId: { type: Schema.Types.ObjectId, ref: 'ChatMessage' },

    reason: {
      type: String,
      enum: CHAT_REPORT_REASON_VALUES,
      required: true,
    },
    description: { type: String, maxlength: 500, trim: true },

    status: {
      type: String,
      enum: CHAT_REPORT_STATUS_VALUES,
      default: CHAT_REPORT_STATUS.OPEN,
    },
    adminAction: { type: String, maxlength: 500, trim: true },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret) {
        const r = ret as Record<string, unknown> & { _id?: { toString(): string }; id?: string };
        r.id = r._id?.toString();
        delete r._id;
        return r;
      },
    },
    toObject: { virtuals: true, versionKey: false },
  }
);

/* -------------------------------------------------------------------------- */
/* Indexes                                                                     */
/* -------------------------------------------------------------------------- */

/** Admin moderation queue — open reports, newest first */
ChatReportSchema.index(
  { status: 1, createdAt: -1 },
  { name: 'chatreport_status_date_idx' }
);

/** Lookup by conversation (e.g. is this convo reported?) */
ChatReportSchema.index(
  { conversationId: 1 },
  { name: 'chatreport_conv_idx' }
);

/** Reporter dedup check (one active report per reporter per conversation) */
ChatReportSchema.index(
  { conversationId: 1, reporterId: 1 },
  { name: 'chatreport_conv_reporter_idx' }
);

/** Admin lookup by reported user */
ChatReportSchema.index(
  { reportedUserId: 1, status: 1 },
  { name: 'chatreport_reporteduser_status_idx' }
);

/* -------------------------------------------------------------------------- */
/* Model Registration (User DB)                                                */
/* -------------------------------------------------------------------------- */

const conn = getUserConnection();
export const ChatReport: Model<IChatReport> =
  (conn.models.ChatReport as Model<IChatReport>) ||
  conn.model<IChatReport>('ChatReport', ChatReportSchema);

export default ChatReport;
