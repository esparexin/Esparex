"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Conversation = void 0;
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
/* -------------------------------------------------------------------------- */
/* Schema                                                                      */
/* -------------------------------------------------------------------------- */
const ConversationSchema = new mongoose_1.Schema({
    adId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Ad', required: true },
    buyerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
    unreadBuyer: { type: Number, default: 0, min: 0 },
    unreadSeller: { type: Number, default: 0, min: 0 },
    isBlocked: { type: Boolean, default: false },
    blockedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    isAdClosed: { type: Boolean, default: false },
    deletedFor: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform(_doc, ret) {
            const r = ret;
            r.id = r._id?.toString();
            delete r._id;
            return r;
        },
    },
    toObject: { virtuals: true, versionKey: false },
});
/* -------------------------------------------------------------------------- */
/* Indexes                                                                     */
/* -------------------------------------------------------------------------- */
/** One chat per buyer per ad — core business rule */
ConversationSchema.index({ adId: 1, buyerId: 1 }, { unique: true, name: 'idx_conversation_ad_buyer_unique_idx' });
/** Seller inbox — newest first */
ConversationSchema.index({ sellerId: 1, lastMessageAt: -1 }, { name: 'idx_conversation_seller_inbox_idx' });
/** Buyer inbox — newest first */
ConversationSchema.index({ buyerId: 1, lastMessageAt: -1 }, { name: 'idx_conversation_buyer_inbox_idx' });
/** Admin moderation queue — blocked conversations */
ConversationSchema.index({ isBlocked: 1, updatedAt: -1 }, { name: 'idx_conversation_blocked_moderation_idx' });
/** Admin moderation — closed conversations */
ConversationSchema.index({ isAdClosed: 1, updatedAt: -1 }, { name: 'idx_conversation_adclosed_idx' });
/* -------------------------------------------------------------------------- */
/* Model Registration (User DB)                                                */
/* -------------------------------------------------------------------------- */
const conn = (0, db_1.getUserConnection)();
exports.Conversation = conn.models.Conversation ||
    conn.model('Conversation', ConversationSchema);
exports.default = exports.Conversation;
//# sourceMappingURL=Conversation.js.map