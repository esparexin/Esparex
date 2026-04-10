import { Types } from 'mongoose';
import { Conversation } from '../../models/Conversation';
import Ad from '../../models/Ad';
import BlockedUser from '../../models/BlockedUser';
import logger from '../../utils/logger';
import { isListingChatClosed } from '../chatAvailabilityService';
import type { IConversationDTO } from '@shared/contracts/chat.contracts';
import {
    PAGE_SIZE_INBOX,
    toConversationDto,
    PopulatedConv
} from './ChatUtils';

export async function startConversation(
    adId: string,
    buyerId: string
): Promise<{ conversationId: string; isNew: boolean }> {
    const ad = await Ad.findById(adId).select('sellerId status isDeleted isChatLocked').lean();
    if (!ad) throw Object.assign(new Error('Ad not found'), { status: 404 });

    const sellerId = String(ad.sellerId);
    if (sellerId === buyerId) {
        throw Object.assign(new Error('You cannot chat with yourself'), { status: 400 });
    }

    if (isListingChatClosed(ad)) {
        throw Object.assign(new Error('This ad is no longer available'), { status: 410 });
    }

    const blockedRelationship = await BlockedUser.exists({
        $or: [
            { blockerId: new Types.ObjectId(buyerId), blockedId: new Types.ObjectId(sellerId) },
            { blockerId: new Types.ObjectId(sellerId), blockedId: new Types.ObjectId(buyerId) },
        ],
    });
    if (blockedRelationship) {
        logger.warn('[BlockGuard] Chat start denied due to block relationship', { buyerId, sellerId, adId });
        throw Object.assign(new Error('Chat unavailable due to block settings'), { status: 403, code: 'USER_BLOCKED' });
    }

    const existing = await Conversation.findOne({ adId, buyerId }).lean();
    if (existing) {
        await Conversation.updateOne(
            { _id: existing._id },
            { $pull: { deletedFor: new Types.ObjectId(buyerId) } }
        );
        return { conversationId: String(existing._id), isNew: false };
    }

    const conv = await Conversation.create({
        adId: new Types.ObjectId(adId),
        buyerId: new Types.ObjectId(buyerId),
        sellerId: new Types.ObjectId(sellerId),
        isAdClosed: isListingChatClosed(ad),
    });

    return { conversationId: String(conv._id), isNew: true };
}

export async function listConversations(
    userId: string,
    before?: string,
    view: 'active' | 'archived' = 'active'
) {
    const query: Record<string, unknown> = {
        $or: [{ buyerId: userId }, { sellerId: userId }],
    };
    query.deletedFor = view === 'archived' ? userId : { $ne: userId };
    if (before) {
        query.lastMessageAt = { $lt: new Date(before) };
    }

    const convs = await Conversation.find(query)
        .sort({ lastMessageAt: -1 })
        .limit(PAGE_SIZE_INBOX)
        .populate('adId', 'title images price status listingType seoSlug isDeleted isChatLocked')
        .populate('buyerId', 'name avatar')
        .populate('sellerId', 'name avatar')
        .lean();

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
    const conv = await Conversation.findOne({
        _id: conversationId,
        $or: [{ buyerId: userId }, { sellerId: userId }],
    })
        .populate('adId', 'title images price status listingType seoSlug isDeleted isChatLocked')
        .populate('buyerId', 'name avatar')
        .populate('sellerId', 'name avatar')
        .lean();

    if (!conv) {
        throw Object.assign(new Error('Conversation not found'), { status: 404 });
    }

    return toConversationDto(conv as unknown as PopulatedConv, userId);
}

export async function blockConversation(conversationId: string, userId: string) {
    const conv = await Conversation.findById(conversationId).lean();
    if (!conv) throw Object.assign(new Error('Conversation not found'), { status: 404 });

    const isBuyer = String(conv.buyerId) === userId;
    const isSeller = String(conv.sellerId) === userId;
    if (!isBuyer && !isSeller) throw Object.assign(new Error('Forbidden'), { status: 403 });

    await Conversation.updateOne(
        { _id: conversationId },
        { $set: { isBlocked: true, blockedBy: new Types.ObjectId(userId) } }
    );
}

export async function assertConversationMember(conversationId: string, userId: string) {
    const conv = await Conversation.findById(conversationId).lean();
    if (!conv) throw Object.assign(new Error('Conversation not found'), { status: 404 });

    const isMember = String(conv.buyerId) === userId || String(conv.sellerId) === userId;
    if (!isMember) throw Object.assign(new Error('Forbidden'), { status: 403 });
}

export async function hideConversation(conversationId: string, userId: string) {
    await assertConversationMember(conversationId, userId);
    await Conversation.updateOne(
        { _id: conversationId },
        { $addToSet: { deletedFor: new Types.ObjectId(userId) } }
    );
}

export async function restoreConversation(conversationId: string, userId: string) {
    await assertConversationMember(conversationId, userId);
    await Conversation.updateOne(
        { _id: conversationId },
        { $pull: { deletedFor: new Types.ObjectId(userId) } }
    );
}
