"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportConversation = reportConversation;
const mongoose_1 = require("mongoose");
const Conversation_1 = require("@core/models/Conversation");
const ChatReport_1 = require("@core/models/ChatReport");
async function reportConversation(conversationId, reporterId, reason, description, messageId) {
    const conv = await Conversation_1.Conversation.findById(conversationId).lean();
    if (!conv)
        throw Object.assign(new Error('Conversation not found'), { status: 404 });
    const buyerStr = String(conv.buyerId);
    const sellerStr = String(conv.sellerId);
    if (reporterId !== buyerStr && reporterId !== sellerStr) {
        throw Object.assign(new Error('Forbidden'), { status: 403 });
    }
    const reportedUserId = reporterId === buyerStr ? sellerStr : buyerStr;
    const report = await ChatReport_1.ChatReport.create({
        conversationId: new mongoose_1.Types.ObjectId(conversationId),
        reporterId: new mongoose_1.Types.ObjectId(reporterId),
        reportedUserId: new mongoose_1.Types.ObjectId(reportedUserId),
        messageId: messageId ? new mongoose_1.Types.ObjectId(messageId) : undefined,
        reason,
        description,
    });
    return report;
}
//# sourceMappingURL=ChatReportService.js.map