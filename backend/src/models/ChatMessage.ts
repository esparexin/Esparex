import { Schema, Document, Model, Types } from 'mongoose';
import { getUserConnection } from '../config/db';

/* -------------------------------------------------------------------------- */
/* Interface                                                                   */
/* -------------------------------------------------------------------------- */

export interface IChatAttachment {
  url: string;
  mimeType: string;
  size: number;
}

export interface IChatMessage extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;

  text: string;
  attachments: IChatAttachment[];

  /** NULL = unread. Set on read receipt. */
  readAt?: Date;

  /** System-generated messages (warnings, ad-sold notice, etc.) */
  isSystemMessage: boolean;

  /** Users who have soft-deleted this message from their view */
  deletedFor: Types.ObjectId[];

  /** 0–1 heuristic risk score (phone/URL density + keyword hits) */
  riskScore: number;
  badWordDetected: boolean;

  createdAt: Date;
  // No updatedAt — messages are immutable after creation
}

/* -------------------------------------------------------------------------- */
/* Schema                                                                      */
/* -------------------------------------------------------------------------- */

const AttachmentSchema = new Schema<IChatAttachment>(
  {
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    text: {
      type: String,
      required: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
      trim: true,
    },
    attachments: { type: [AttachmentSchema], default: [] },

    readAt: { type: Date, default: null },
    isSystemMessage: { type: Boolean, default: false },
    deletedFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    riskScore: { type: Number, default: 0, min: 0, max: 1 },
    badWordDetected: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // immutable — no updatedAt
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

/** Primary query: all messages in a conversation, newest first (reverse scroll) */
ChatMessageSchema.index(
  { conversationId: 1, createdAt: -1 },
  { name: 'msg_conv_date_idx' }
);

/** Read-receipt batch update: unread messages for a receiver in a conversation */
ChatMessageSchema.index(
  { conversationId: 1, receiverId: 1, readAt: 1 },
  { name: 'msg_read_receipt_idx' }
);

/** Admin high-risk filter */
ChatMessageSchema.index(
  { riskScore: -1, createdAt: -1 },
  { name: 'msg_risk_score_idx' }
);

/* -------------------------------------------------------------------------- */
/* Model Registration (User DB)                                                */
/* -------------------------------------------------------------------------- */

const conn = getUserConnection();
export const ChatMessage: Model<IChatMessage> =
  (conn.models.ChatMessage as Model<IChatMessage>) ||
  conn.model<IChatMessage>('ChatMessage', ChatMessageSchema);

export default ChatMessage;
