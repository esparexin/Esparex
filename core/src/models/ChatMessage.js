"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessage = void 0;
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
/* -------------------------------------------------------------------------- */
/* Schema                                                                      */
/* -------------------------------------------------------------------------- */
const AttachmentSchema = new mongoose_1.Schema({
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    name: { type: String, maxlength: 160 },
}, { _id: false });
const ChatMessageSchema = new mongoose_1.Schema({
    conversationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
    },
    senderId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    text: {
        type: String,
        required: true,
        maxlength: [2000, 'Message cannot exceed 2000 characters'],
        trim: true,
    },
    attachments: { type: [AttachmentSchema], default: [] },
    readAt: { type: Date, default: null },
    isSystemMessage: { type: Boolean, default: false },
    deletedFor: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    riskScore: { type: Number, default: 0, min: 0, max: 1 },
    badWordDetected: { type: Boolean, default: false },
}, {
    timestamps: { createdAt: true, updatedAt: false }, // immutable — no updatedAt
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
/** Primary query: all messages in a conversation, newest first (reverse scroll) */
ChatMessageSchema.index({ conversationId: 1, createdAt: -1 }, { name: 'idx_chatmessage_conv_date_idx' });
/** Read-receipt batch update: unread messages for a receiver in a conversation */
ChatMessageSchema.index({ conversationId: 1, receiverId: 1, readAt: 1 }, { name: 'idx_chatmessage_read_receipt_idx' });
/** Admin high-risk filter */
ChatMessageSchema.index({ riskScore: -1, createdAt: -1 }, { name: 'idx_chatmessage_risk_score_idx' });
/* -------------------------------------------------------------------------- */
/* Model Registration (User DB)                                                */
/* -------------------------------------------------------------------------- */
const conn = (0, db_1.getUserConnection)();
exports.ChatMessage = conn.models.ChatMessage ||
    conn.model('ChatMessage', ChatMessageSchema);
exports.default = exports.ChatMessage;
//# sourceMappingURL=ChatMessage.js.map