import { Types } from 'mongoose';
import { Conversation } from '../../../../models/Conversation';
import { ChatReport } from '../../../../models/ChatReport';
import { ChatMessage } from '../../../../models/ChatMessage';
import Ad from '../../../../models/Ad';
import BlockedUser from '../../../../models/BlockedUser';
import { ChatRepositoryPort } from '../../../../domains/chat';
import { PAGE_SIZE_INBOX } from '../../../../services/chat/ChatUtils';
import { PAGE_SIZE_MESSAGES } from '../../../../services/chat/ChatUtils';

export class MongoChatRepositoryAdapter implements ChatRepositoryPort {
    public async findConversationById(conversationId: string): Promise<any> {
        return await Conversation.findById(conversationId).lean();
    }
    public async createReport(data: any): Promise<any> {
        return await ChatReport.create({
            conversationId: new Types.ObjectId(data.conversationId),
            reporterId: new Types.ObjectId(data.reporterId),
            reportedUserId: new Types.ObjectId(data.reportedUserId),
            messageId: data.messageId ? new Types.ObjectId(data.messageId) : undefined,
            reason: data.reason,
            description: data.description,
        });
    }
    public async getAdChatInfo(adId: string): Promise<any> {
        return await Ad.findById(adId).select('sellerId status isDeleted isChatLocked').lean();
    }
    public async checkBlockRelationship(buyerId: string, sellerId: string): Promise<boolean> {
        const exists = await BlockedUser.exists({
            $or: [
                { blockerId: new Types.ObjectId(buyerId), blockedId: new Types.ObjectId(sellerId) },
                { blockerId: new Types.ObjectId(sellerId), blockedId: new Types.ObjectId(buyerId) },
            ],
        });
        return !!exists;
    }
    public async findExistingConversation(adId: string, buyerId: string): Promise<any> {
        return await Conversation.findOne({ adId, buyerId }).lean();
    }
    public async removeUserFromDeleted(conversationId: string, userId: string): Promise<void> {
        await Conversation.updateOne({ _id: conversationId }, { $pull: { deletedFor: new Types.ObjectId(userId) } });
    }
    public async createConversation(data: any): Promise<any> {
        return await Conversation.create({
            adId: new Types.ObjectId(data.adId),
            buyerId: new Types.ObjectId(data.buyerId),
            sellerId: new Types.ObjectId(data.sellerId),
            isAdClosed: data.isAdClosed,
        });
    }
    public async listConversations(userId: string, before?: string, view: 'active' | 'archived' = 'active'): Promise<any[]> {
        const query: Record<string, unknown> = { $or: [{ buyerId: userId }, { sellerId: userId }] };
        query.deletedFor = view === 'archived' ? userId : { $ne: userId };
        if (before) query.lastMessageAt = { $lt: new Date(before) };
        return await Conversation.find(query).sort({ lastMessageAt: -1 }).limit(PAGE_SIZE_INBOX).populate('adId', 'title images price status listingType seoSlug isDeleted isChatLocked').populate('buyerId', 'name avatar').populate('sellerId', 'name avatar').lean();
    }
    public async getPopulatedConversation(conversationId: string, userId: string): Promise<any> {
        return await Conversation.findOne({ _id: conversationId, $or: [{ buyerId: userId }, { sellerId: userId }] }).populate('adId', 'title images price status listingType seoSlug isDeleted isChatLocked').populate('buyerId', 'name avatar').populate('sellerId', 'name avatar').lean();
    }
    public async blockConversation(conversationId: string, userId: string): Promise<void> {
        await Conversation.updateOne({ _id: conversationId }, { $set: { isBlocked: true, blockedBy: new Types.ObjectId(userId) } });
    }
    public async addUserToDeleted(conversationId: string, userId: string): Promise<void> {
        await Conversation.updateOne({ _id: conversationId }, { $addToSet: { deletedFor: new Types.ObjectId(userId) } });
    }
    public async findMessages(conversationId: string, userId: string, before?: string, after?: string): Promise<{ msgs: any[], nextCursor?: string }> {
        const baseFilter: Record<string, unknown> = { conversationId, deletedFor: { $ne: new Types.ObjectId(userId) } };
        if (after) {
            const msgs = await ChatMessage.find({ ...baseFilter, createdAt: { $gt: new Date(after) } }).sort({ createdAt: 1 }).lean();
            return { msgs, nextCursor: undefined };
        }
        if (before) baseFilter.createdAt = { $lt: new Date(before) };
        const msgs = await ChatMessage.find(baseFilter).sort({ createdAt: -1 }).limit(PAGE_SIZE_MESSAGES).lean();
        const lastMsg = msgs[msgs.length - 1];
        const nextCursor = msgs.length === PAGE_SIZE_MESSAGES && lastMsg?.createdAt ? lastMsg.createdAt.toISOString() : undefined;
        return { msgs: msgs.reverse(), nextCursor };
    }
    public async updateConversationAdClosedStatus(conversationId: string, isAdClosed: boolean): Promise<void> {
        await Conversation.updateOne({ _id: conversationId }, { $set: { isAdClosed } });
    }
    public async createMessage(data: any): Promise<any> {
        return await ChatMessage.create({
            conversationId: new Types.ObjectId(data.conversationId),
            senderId: new Types.ObjectId(data.senderId),
            receiverId: new Types.ObjectId(data.receiverId),
            text: data.text,
            attachments: data.attachments,
            riskScore: data.riskScore,
            badWordDetected: data.badWordDetected,
        });
    }
    public async updateConversationPreview(conversationId: string, unreadField: string, senderId: string, preview: string, messageDate: Date): Promise<void> {
        await Conversation.updateOne({ _id: conversationId }, { $set: { lastMessage: preview, lastMessageAt: messageDate }, $inc: { [unreadField]: 1 }, $pull: { deletedFor: new Types.ObjectId(senderId) } });
    }
    public async createSystemMessage(data: any): Promise<void> {
        await ChatMessage.create({
            conversationId: new Types.ObjectId(data.conversationId),
            senderId: new Types.ObjectId(data.senderId),
            receiverId: new Types.ObjectId(data.receiverId),
            text: data.text,
            isSystemMessage: true,
            riskScore: 0,
        });
    }
    public async markMessagesRead(conversationId: string, userId: string): Promise<void> {
        await ChatMessage.updateMany({ conversationId, receiverId: new Types.ObjectId(userId), readAt: null }, { $set: { readAt: new Date() } });
    }
    public async resetUnreadCount(conversationId: string, unreadField: string): Promise<void> {
        await Conversation.updateOne({ _id: conversationId }, { $set: { [unreadField]: 0 } });
    }
}
