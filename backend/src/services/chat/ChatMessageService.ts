import { Types } from 'mongoose';
import { Conversation } from '../../models/Conversation';
import { ChatMessage } from '../../models/ChatMessage';
import Ad from '../../models/Ad';
import { isListingChatClosed } from '../chatAvailabilityService';
import type { IChatAttachment } from '../../models/ChatMessage';
import {
    PAGE_SIZE_MESSAGES,
    sanitizeText,
    detectBadWords,
    computeRiskScore,
    maskSensitiveData,
    buildConversationPreview
} from './ChatUtils';

export async function getMessages(
    conversationId: string,
    userId: string,
    before?: string,
    after?: string
) {
    const baseFilter: Record<string, unknown> = {
        conversationId,
        deletedFor: { $ne: new Types.ObjectId(userId) },
    };

    if (after) {
        const msgs = await ChatMessage.find({
            ...baseFilter,
            createdAt: { $gt: new Date(after) },
        })
            .sort({ createdAt: 1 })
            .lean();
        return { msgs, nextCursor: undefined };
    }

    if (before) {
        baseFilter.createdAt = { $lt: new Date(before) };
    }

    const msgs = await ChatMessage.find(baseFilter)
        .sort({ createdAt: -1 })
        .limit(PAGE_SIZE_MESSAGES)
        .lean();

    const lastMsg = msgs[msgs.length - 1];
    const nextCursor =
        msgs.length === PAGE_SIZE_MESSAGES && lastMsg?.createdAt
            ? (lastMsg.createdAt).toISOString()
            : undefined;

    return { msgs: msgs.reverse(), nextCursor };
}

export async function sendMessage(
    conversationId: string,
    senderId: string,
    rawText: string,
    attachments: IChatAttachment[] = []
): Promise<InstanceType<typeof ChatMessage>> {
    const conv = await Conversation.findById(conversationId);
    if (!conv) throw Object.assign(new Error('Conversation not found'), { status: 404 });
    const listing = await Ad.findById(conv.adId).select('status isDeleted isChatLocked').lean();
    const derivedClosed = isListingChatClosed(listing);

    if (conv.isAdClosed !== derivedClosed) {
        conv.isAdClosed = derivedClosed;
        await conv.save();
    }

    const buyerStr = String(conv.buyerId);
    const sellerStr = String(conv.sellerId);

    if (senderId !== buyerStr && senderId !== sellerStr) {
        throw Object.assign(new Error('Forbidden'), { status: 403 });
    }
    if (conv.isBlocked) throw Object.assign(new Error('This chat has been blocked'), { status: 403, code: 'CHAT_BLOCKED' });
    if (derivedClosed) throw Object.assign(new Error('This ad is closed — chat is read-only'), { status: 403, code: 'CHAT_CLOSED' });

    const receiverId = senderId === buyerStr ? sellerStr : buyerStr;

    const sanitized = sanitizeText(rawText);
    const badWordDetected = detectBadWords(sanitized);
    const riskScore = computeRiskScore(sanitized);
    const storedText = maskSensitiveData(sanitized);

    const msg = await ChatMessage.create({
        conversationId: new Types.ObjectId(conversationId),
        senderId: new Types.ObjectId(senderId),
        receiverId: new Types.ObjectId(receiverId),
        text: storedText,
        attachments,
        riskScore,
        badWordDetected,
    });

    const unreadField = receiverId === buyerStr ? 'unreadBuyer' : 'unreadSeller';
    await Conversation.updateOne(
        { _id: conversationId },
        {
            $set: {
                lastMessage: buildConversationPreview(storedText, attachments),
                lastMessageAt: msg.createdAt,
            },
            $inc: { [unreadField]: 1 },
            $pull: { deletedFor: new Types.ObjectId(senderId) },
        }
    );

    // 📣 NOTIFY RECEIVER (Push + In-App)
    (async () => {
        try {
            const { dispatchTemplatedNotification } = await import('../NotificationService');
            const UserModel = (await import('../../models/User')).default;
            const senderSnippet = await UserModel.findById(senderId).select('name').lean();
            
            await dispatchTemplatedNotification(
                receiverId,
                'CHAT' as any,
                'NEW_CHAT_MESSAGE',
                { 
                    senderName: (senderSnippet as { name?: string })?.name || 'User',
                    text: storedText.length > 50 ? `${storedText.substring(0, 47)}...` : storedText
                },
                { conversationId, type: 'chat_message' }
            );
        } catch (err) {
            logger.error('Failed to dispatch chat notification', { error: err });
        }
    })();

    if (riskScore >= 0.8) {
        await ChatMessage.create({
            conversationId: new Types.ObjectId(conversationId),
            senderId: new Types.ObjectId(senderId),
            receiverId: new Types.ObjectId(receiverId),
            text: '⚠️ This message was flagged for review by our safety system.',
            isSystemMessage: true,
            riskScore: 0,
        });
    }

    return msg;
}

export async function markRead(conversationId: string, userId: string) {
    const conv = await Conversation.findById(conversationId).lean();
    if (!conv) throw Object.assign(new Error('Conversation not found'), { status: 404 });

    const buyerStr = String(conv.buyerId);
    const sellerStr = String(conv.sellerId);
    if (userId !== buyerStr && userId !== sellerStr) {
        throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    const now = new Date();
    await ChatMessage.updateMany(
        { conversationId, receiverId: new Types.ObjectId(userId), readAt: null },
        { $set: { readAt: now } }
    );

    const unreadField = userId === buyerStr ? 'unreadBuyer' : 'unreadSeller';
    await Conversation.updateOne({ _id: conversationId }, { $set: { [unreadField]: 0 } });
}
