"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatReport = void 0;
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const chatStatus_1 = require("@core/constants/enums/chatStatus");
/* -------------------------------------------------------------------------- */
/* Schema                                                                      */
/* -------------------------------------------------------------------------- */
const ChatReportSchema = new mongoose_1.Schema({
    conversationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
    },
    reporterId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    reportedUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    messageId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ChatMessage' },
    reason: {
        type: String,
        enum: chatStatus_1.CHAT_REPORT_REASON_VALUES,
        required: true,
    },
    description: { type: String, maxlength: 500, trim: true },
    status: {
        type: String,
        enum: chatStatus_1.CHAT_REPORT_STATUS_VALUES,
        default: chatStatus_1.CHAT_REPORT_STATUS.OPEN,
    },
    adminAction: { type: String, maxlength: 500, trim: true },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
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
/** Admin moderation queue — open reports, newest first */
ChatReportSchema.index({ status: 1, createdAt: -1 }, { name: 'idx_chatreport_status_date_idx' });
/** Lookup by conversation (e.g. is this convo reported?) */
ChatReportSchema.index({ conversationId: 1 }, { name: 'idx_chatreport_conv_idx' });
/** Reporter dedup check (one active report per reporter per conversation) */
ChatReportSchema.index({ conversationId: 1, reporterId: 1 }, { name: 'idx_chatreport_conv_reporter_idx' });
/** Admin lookup by reported user */
ChatReportSchema.index({ reportedUserId: 1, status: 1 }, { name: 'idx_chatreport_reporteduser_status_idx' });
/* -------------------------------------------------------------------------- */
/* Model Registration (User DB)                                                */
/* -------------------------------------------------------------------------- */
const conn = (0, db_1.getUserConnection)();
exports.ChatReport = conn.models.ChatReport ||
    conn.model('ChatReport', ChatReportSchema);
exports.default = exports.ChatReport;
//# sourceMappingURL=ChatReport.js.map