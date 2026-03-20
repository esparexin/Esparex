import { Schema, Document, Model, Types } from 'mongoose';
import { getUserConnection } from '../config/db';

/* -------------------------------------------------------------------------- */
/* Interface                                                                   */
/* -------------------------------------------------------------------------- */

export interface IConversation extends Document {
  adId: Types.ObjectId;
  buyerId: Types.ObjectId;
  sellerId: Types.ObjectId;

  lastMessage?: string;
  lastMessageAt?: Date;

  unreadBuyer: number;
  unreadSeller: number;

  isBlocked: boolean;
  blockedBy?: Types.ObjectId;

  isAdClosed: boolean;

  /** Users who have soft-hidden this conversation from their inbox */
  deletedFor: Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

/* -------------------------------------------------------------------------- */
/* Schema                                                                      */
/* -------------------------------------------------------------------------- */

const ConversationSchema = new Schema<IConversation>(
  {
    adId: { type: Schema.Types.ObjectId, ref: 'Ad', required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    lastMessage: { type: String },
    lastMessageAt: { type: Date },

    unreadBuyer: { type: Number, default: 0, min: 0 },
    unreadSeller: { type: Number, default: 0, min: 0 },

    isBlocked: { type: Boolean, default: false },
    blockedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    isAdClosed: { type: Boolean, default: false },

    deletedFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
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

/** One chat per buyer per ad — core business rule */
ConversationSchema.index(
  { adId: 1, buyerId: 1 },
  { unique: true, name: 'conv_ad_buyer_unique_idx' }
);

/** Seller inbox — newest first */
ConversationSchema.index(
  { sellerId: 1, lastMessageAt: -1 },
  { name: 'conv_seller_inbox_idx' }
);

/** Buyer inbox — newest first */
ConversationSchema.index(
  { buyerId: 1, lastMessageAt: -1 },
  { name: 'conv_buyer_inbox_idx' }
);

/** Admin moderation queue — blocked conversations */
ConversationSchema.index(
  { isBlocked: 1, updatedAt: -1 },
  { name: 'conv_blocked_moderation_idx' }
);

/** Admin moderation — closed conversations */
ConversationSchema.index(
  { isAdClosed: 1, updatedAt: -1 },
  { name: 'conv_adclosed_idx' }
);

/* -------------------------------------------------------------------------- */
/* Model Registration (User DB)                                                */
/* -------------------------------------------------------------------------- */

const conn = getUserConnection();
export const Conversation: Model<IConversation> =
  (conn.models.Conversation as Model<IConversation>) ||
  conn.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;
