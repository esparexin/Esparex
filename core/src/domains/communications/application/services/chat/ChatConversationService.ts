import { chatRepository } from '../../../../../composition/chat';
import logger from '../../../../../utils/logger';
import { isListingChatClosed } from '../ChatAvailabilityService';
import type { IConversationDTO } from "@esparex/contracts";
import {
    PAGE_SIZE_INBOX,
    toConversationDto,
    PopulatedConv
} from './ChatUtils';

export async function startConversation(
    adId: string,
    buyerId: string
): Promise<{ conversationId: string; isNew: boolean }> {
    const ad = await chatRepository.getAdChatInfo(adId);
    if (!ad) throw Object.assign(new Error('Ad not found'), { status: 404 });

    const sellerId = String(ad.sellerId);
    if (sellerId === buyerId) {
        throw Object.assign(new Error('You cannot chat with yourself'), { status: 400 });
    }

    if (isListingChatClosed(ad)) {
        throw Object.assign(new Error('This ad is no longer available'), { status: 410 });
    }

    const blockedRelationship = await chatRepository.checkBlockRelationship(buyerId, sellerId);
    if (blockedRelationship) {
        logger.warn('[BlockGuard] Chat start denied due to block relationship', { buyerId, sellerId, adId });
        throw Object.assign(new Error('Chat unavailable due to block settings'), { status: 403, code: 'USER_BLOCKED' });
    }

    const existing = await chatRepository.findExistingConversation(adId, buyerId);
    if (existing) {
        await chatRepository.removeUserFromDeleted(String(existing._id), buyerId);
        return { conversationId: String(existing._id), isNew: false };
    }

    const conv = await chatRepository.createConversation({
        adId,
        buyerId,
        sellerId,
        isAdClosed: isListingChatClosed(ad),
    });

    return { conversationId: String(conv._id), isNew: true };
}

export async function listConversations(
    userId: string,
    before?: string,
    view: 'active' | 'archived' = 'active'
) {
    const convs = await chatRepository.listConversations(userId, before, view);

    const lastConv = convs[convs.length - 1];
    const nextCursor =
        convs.length === PAGE_SIZE_INBOX && lastConv?.lastMessageAt
            ? lastConv.lastMessageAt.toISOString()
            : undefined;

    return {
        convs: convs.map((conversation) => toConversationDto(
            conversation as unknown as PopulatedConv,
            userId
        )),
        nextCursor,
    };
}

export async function getConversationForUser(conversationId: string, userId: string): Promise<IConversationDTO> {
    const conv = await chatRepository.getPopulatedConversation(conversationId, userId);

    if (!conv) {
        throw Object.assign(new Error('Conversation not found'), { status: 404 });
    }

    return toConversationDto(conv as unknown as PopulatedConv, userId);
}

export async function blockConversation(conversationId: string, userId: string) {
    const conv = await chatRepository.findConversationById(conversationId);
    if (!conv) throw Object.assign(new Error('Conversation not found'), { status: 404 });

    const isBuyer = String(conv.buyerId) === userId;
    const isSeller = String(conv.sellerId) === userId;
    if (!isBuyer && !isSeller) throw Object.assign(new Error('Forbidden'), { status: 403 });

    await chatRepository.blockConversation(conversationId, userId);
}

export async function assertConversationMember(conversationId: string, userId: string) {
    const conv = await chatRepository.findConversationById(conversationId);
    if (!conv) throw Object.assign(new Error('Conversation not found'), { status: 404 });

    const isMember = String(conv.buyerId) === userId || String(conv.sellerId) === userId;
    if (!isMember) throw Object.assign(new Error('Forbidden'), { status: 403 });
}

export async function hideConversation(conversationId: string, userId: string) {
    await assertConversationMember(conversationId, userId);
    await chatRepository.addUserToDeleted(conversationId, userId);
}

export async function restoreConversation(conversationId: string, userId: string) {
    await assertConversationMember(conversationId, userId);
    await chatRepository.removeUserFromDeleted(conversationId, userId);
}
