import { chatRepository } from '../../composition/chat';
import type { ChatReportReasonValue } from '@esparex/contracts';

export async function reportConversation(
    conversationId: string,
    reporterId: string,
    reason: ChatReportReasonValue,
    description?: string,
    messageId?: string
) {
    const conv = await chatRepository.findConversationById(conversationId);
    if (!conv) throw Object.assign(new Error('Conversation not found'), { status: 404 });

    const buyerStr = String(conv.buyerId);
    const sellerStr = String(conv.sellerId);
    if (reporterId !== buyerStr && reporterId !== sellerStr) {
        throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    const reportedUserId = reporterId === buyerStr ? sellerStr : buyerStr;

    const report = await chatRepository.createReport({
        conversationId,
        reporterId,
        reportedUserId,
        messageId,
        reason,
        description,
    });

    return report;
}
