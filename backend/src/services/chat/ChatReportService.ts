import { Types } from 'mongoose';
import { Conversation } from '../../models/Conversation';
import { ChatReport } from '../../models/ChatReport';
import type { ChatReportReasonValue } from '@shared/enums/chatStatus';

export async function reportConversation(
    conversationId: string,
    reporterId: string,
    reason: ChatReportReasonValue,
    description?: string,
    messageId?: string
) {
    const conv = await Conversation.findById(conversationId).lean();
    if (!conv) throw Object.assign(new Error('Conversation not found'), { status: 404 });

    const buyerStr = String(conv.buyerId);
    const sellerStr = String(conv.sellerId);
    if (reporterId !== buyerStr && reporterId !== sellerStr) {
        throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    const reportedUserId = reporterId === buyerStr ? sellerStr : buyerStr;

    const report = await ChatReport.create({
        conversationId: new Types.ObjectId(conversationId),
        reporterId: new Types.ObjectId(reporterId),
        reportedUserId: new Types.ObjectId(reportedUserId),
        messageId: messageId ? new Types.ObjectId(messageId) : undefined,
        reason,
        description,
    });

    return report;
}
