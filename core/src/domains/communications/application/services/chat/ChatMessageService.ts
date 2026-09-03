import { chatRepository } from '../../../../../composition/chat';
import { isListingChatClosed } from '../ChatAvailabilityService';
import logger from '../../../../../utils/logger';
import { NOTIFICATION_TYPE } from '@esparex/contracts';
import type { IChatAttachment } from '../../../../../models/ChatMessage';
import {
    sanitizeText,
    detectBadWords,
    computeRiskScore,
    maskSensitiveData,
    buildConversationPreview
} from './ChatUtils';

export interface GetMessagesParams {
    conversationId: string;
    userId: string;
    before?: string;
    after?: string;
}

export async function getMessages(params: GetMessagesParams) {
    const { conversationId, userId, before, after } = params;
    return await chatRepository.findMessages(conversationId, userId, before, after);
}

export async function sendMessage(
    conversationId: string,
    senderId: string,
    rawText: string,
    attachments: IChatAttachment[] = []
) {
    const conv = await chatRepository.findConversationById(conversationId);
    if (!conv) throw Object.assign(new Error('Conversation not found'), { status: 404 });
    const listing = await chatRepository.getAdChatInfo(String(conv.adId));
    const derivedClosed = isListingChatClosed(listing);

    if (conv.isAdClosed !== derivedClosed) {
        await chatRepository.updateConversationAdClosedStatus(conversationId, derivedClosed);
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

    const msg = await chatRepository.createMessage({
        conversationId,
        senderId,
        receiverId,
        text: storedText,
        attachments,
        riskScore,
        badWordDetected,
    });

    const unreadField = receiverId === buyerStr ? 'unreadBuyer' : 'unreadSeller';
    const preview = buildConversationPreview(storedText, attachments);
    
    await chatRepository.updateConversationPreview(
        conversationId,
        unreadField,
        senderId,
        preview,
        msg.createdAt
    );

    // 📡 REALTIME SOCKET BROADCAST (Receiver + Sender rooms + Inbox invalidation)
    try {
        const { getIO } = await import('../../../../../config/socket');
        const io = getIO();
        const msgDto = {
            id: String(msg._id ?? msg.id),
            conversationId: String(msg.conversationId),
            senderId: String(msg.senderId),
            text: msg.text,
            attachments: msg.attachments ?? [],
            readAt: msg.readAt ? new Date(msg.readAt).toISOString() : undefined,
            isSystemMessage: Boolean(msg.isSystemMessage),
            createdAt: msg.createdAt ? new Date(msg.createdAt).toISOString() : new Date().toISOString(),
        };

        io.to(receiverId).emit('chat:message', { conversationId, message: msgDto });
        io.to(senderId).emit('chat:message', { conversationId, message: msgDto });
        io.to(receiverId).emit('chat:inbox_updated', { conversationId });
        io.to(senderId).emit('chat:inbox_updated', { conversationId });
    } catch {
        // Safe fallback if Socket.io server is uninitialized (e.g. unit test runner)
    }

    // 📣 NOTIFY RECEIVER (Push + In-App)
    void (async () => {
        try {
            const { dispatchTemplatedNotification } = await import('../../../../../domains/notifications/application/NotificationService');
            const UserModel = (await import('../../../../../models/User')).default;
            const senderSnippet = await UserModel.findById(senderId).select('name').lean();
            
            await dispatchTemplatedNotification(
                receiverId,
                NOTIFICATION_TYPE.CHAT,
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
        await chatRepository.createSystemMessage({
            conversationId,
            senderId,
            receiverId,
            text: '⚠️ This message was flagged for review by our safety system.',
        });
    }

    return msg;
}

export async function markRead(conversationId: string, userId: string) {
    const conv = await chatRepository.findConversationById(conversationId);
    if (!conv) throw Object.assign(new Error('Conversation not found'), { status: 404 });

    const buyerStr = String(conv.buyerId);
    const sellerStr = String(conv.sellerId);
    if (userId !== buyerStr && userId !== sellerStr) {
        throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    await chatRepository.markMessagesRead(conversationId, userId);

    const unreadField = userId === buyerStr ? 'unreadBuyer' : 'unreadSeller';
    await chatRepository.resetUnreadCount(conversationId, unreadField);

    // 📡 REALTIME READ RECEIPT BROADCAST
    try {
        const { getIO } = await import('../../../../../config/socket');
        const io = getIO();
        const otherUserId = userId === buyerStr ? sellerStr : buyerStr;
        const readAt = new Date().toISOString();

        io.to(otherUserId).emit('chat:read', { conversationId, readerId: userId, readAt });
        io.to(userId).emit('chat:read', { conversationId, readerId: userId, readAt });
        io.to(otherUserId).emit('chat:inbox_updated', { conversationId });
        io.to(userId).emit('chat:inbox_updated', { conversationId });
    } catch {
        // Safe fallback if Socket.io server is uninitialized
    }
}

