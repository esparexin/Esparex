import { Types } from 'mongoose';
import { Conversation } from '../../../../models/Conversation';
import { ChatReport } from '../../../../models/ChatReport';
import { ChatMessage, IChatAttachment } from '../../../../models/ChatMessage';
import type { ChatReportReasonValue } from '@esparex/shared';
import Ad from '../../../../models/Ad';
import BlockedUser from '../../../../models/BlockedUser';
import { ChatRepositoryPort } from '../../../../domains/chat';
import { PAGE_SIZE_INBOX } from '../../../../services/chat/ChatUtils';
import { PAGE_SIZE_MESSAGES } from '../../../../services/chat/ChatUtils';

export class MongoChatRepositoryAdapter implements ChatRepositoryPort {
    public async findConversationById(conversationId: string): Promise<Record<string, unknown> | null> {
        return await Conversation.findById(conversationId).lean() as unknown as Record<string, unknown> | null;
    }
    public async createReport(data: Record<string, unknown>): Promise<Record<string, unknown>> {
        return await ChatReport.create({
            conversationId: new Types.ObjectId(data.conversationId as string),
            reporterId: new Types.ObjectId(data.reporterId as string),
            reportedUserId: new Types.ObjectId(data.reportedUserId as string),
            messageId: data.messageId ? new Types.ObjectId(data.messageId as string) : undefined,
            reason: data.reason as ChatReportReasonValue,
            description: data.description as string,
        }) as unknown as Record<string, unknown>;
    }
    public async getAdChatInfo(adId: string): Promise<Record<string, unknown> | null> {
        return await Ad.findById(adId).select('sellerId status isDeleted isChatLocked').lean() as unknown as Record<string, unknown> | null;
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
    public async findExistingConversation(adId: string, buyerId: string): Promise<Record<string, unknown> | null> {
        return await Conversation.findOne({ adId, buyerId }).lean() as unknown as Record<string, unknown> | null;
    }
    public async removeUserFromDeleted(conversationId: string, userId: string): Promise<void> {
        await Conversation.updateOne({ _id: conversationId }, { $pull: { deletedFor: new Types.ObjectId(userId) } });
    }
    public async createConversation(data: Record<string, unknown>): Promise<Record<string, unknown>> {
        return await Conversation.create({
            adId: new Types.ObjectId(data.adId as string),
            buyerId: new Types.ObjectId(data.buyerId as string),
            sellerId: new Types.ObjectId(data.sellerId as string),
            isAdClosed: data.isAdClosed as boolean,
        }) as unknown as Record<string, unknown>;
    }
    public async listConversations(userId: string, before?: string, view: 'active' | 'archived' = 'active'): Promise<Record<string, unknown>[]> {
        const query: Record<string, unknown> = { $or: [{ buyerId: userId }, { sellerId: userId }] };
        query.deletedFor = view === 'archived' ? userId : { $ne: userId };
        if (before) query.lastMessageAt = { $lt: new Date(before) };
        return await Conversation.find(query).sort({ lastMessageAt: -1 }).limit(PAGE_SIZE_INBOX).populate('adId', 'title images price status listingType seoSlug isDeleted isChatLocked').populate('buyerId', 'name avatar').populate('sellerId', 'name avatar').lean() as unknown as Record<string, unknown>[];
    }
    public async getPopulatedConversation(conversationId: string, userId: string): Promise<Record<string, unknown> | null> {
        return await Conversation.findOne({ _id: conversationId, $or: [{ buyerId: userId }, { sellerId: userId }] }).populate('adId', 'title images price status listingType seoSlug isDeleted isChatLocked').populate('buyerId', 'name avatar').populate('sellerId', 'name avatar').lean() as unknown as Record<string, unknown> | null;
    }
    public async blockConversation(conversationId: string, userId: string): Promise<void> {
        await Conversation.updateOne({ _id: conversationId }, { $set: { isBlocked: true, blockedBy: new Types.ObjectId(userId) } });
    }
    public async addUserToDeleted(conversationId: string, userId: string): Promise<void> {
        await Conversation.updateOne({ _id: conversationId }, { $addToSet: { deletedFor: new Types.ObjectId(userId) } });
    }
    public async findMessages(conversationId: string, userId: string, before?: string, after?: string): Promise<{ msgs: Record<string, unknown>[]; nextCursor?: string }> {
        const baseFilter: Record<string, unknown> = { conversationId, deletedFor: { $ne: new Types.ObjectId(userId) } };
        if (after) {
            const msgs = await ChatMessage.find({ ...baseFilter, createdAt: { $gt: new Date(after) } }).sort({ createdAt: 1 }).lean() as unknown as Record<string, unknown>[];
            return { msgs, nextCursor: undefined };
        }
        if (before) baseFilter.createdAt = { $lt: new Date(before) };
        const msgs = await ChatMessage.find(baseFilter).sort({ createdAt: -1 }).limit(PAGE_SIZE_MESSAGES).lean() as unknown as Record<string, unknown>[];
        const lastMsg = msgs[msgs.length - 1];
        const nextCursor = msgs.length === PAGE_SIZE_MESSAGES && lastMsg?.createdAt ? (lastMsg.createdAt as Date).toISOString() : undefined;
        return { msgs: msgs.reverse(), nextCursor };
    }
    public async updateConversationAdClosedStatus(conversationId: string, isAdClosed: boolean): Promise<void> {
        await Conversation.updateOne({ _id: conversationId }, { $set: { isAdClosed } });
    }
    public async createMessage(data: Record<string, unknown>): Promise<Record<string, unknown>> {
        return await ChatMessage.create({
            conversationId: new Types.ObjectId(data.conversationId as string),
            senderId: new Types.ObjectId(data.senderId as string),
            receiverId: new Types.ObjectId(data.receiverId as string),
            text: data.text as string,
            attachments: data.attachments as unknown as IChatAttachment[],
            riskScore: data.riskScore as number,
            badWordDetected: data.badWordDetected as boolean,
        }) as unknown as Record<string, unknown>;
    }
    public async updateConversationPreview(conversationId: string, unreadField: string, senderId: string, preview: string, messageDate: Date): Promise<void> {
        await Conversation.updateOne({ _id: conversationId }, { $set: { lastMessage: preview, lastMessageAt: messageDate }, $inc: { [unreadField]: 1 }, $pull: { deletedFor: new Types.ObjectId(senderId) } });
    }
    public async createSystemMessage(data: Record<string, unknown>): Promise<void> {
        await ChatMessage.create({
            conversationId: new Types.ObjectId(data.conversationId as string),
            senderId: new Types.ObjectId(data.senderId as string),
            receiverId: new Types.ObjectId(data.receiverId as string),
            text: data.text as string,
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
