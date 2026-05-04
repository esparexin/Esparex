"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startConversation = startConversation;
exports.listConversations = listConversations;
exports.getConversationForUser = getConversationForUser;
exports.blockConversation = blockConversation;
exports.assertConversationMember = assertConversationMember;
exports.hideConversation = hideConversation;
exports.restoreConversation = restoreConversation;
const mongoose_1 = require("mongoose");
const Conversation_1 = require("@core/models/Conversation");
const Ad_1 = __importDefault(require("@core/models/Ad"));
const BlockedUser_1 = __importDefault(require("@core/models/BlockedUser"));
const logger_1 = __importDefault(require("@core/utils/logger"));
const ChatAvailabilityService_1 = require("../ChatAvailabilityService");
const ChatUtils_1 = require("./ChatUtils");
async function startConversation(adId, buyerId) {
    const ad = await Ad_1.default.findById(adId).select('sellerId status isDeleted isChatLocked').lean();
    if (!ad)
        throw Object.assign(new Error('Ad not found'), { status: 404 });
    const sellerId = String(ad.sellerId);
    if (sellerId === buyerId) {
        throw Object.assign(new Error('You cannot chat with yourself'), { status: 400 });
    }
    if ((0, ChatAvailabilityService_1.isListingChatClosed)(ad)) {
        throw Object.assign(new Error('This ad is no longer available'), { status: 410 });
    }
    const blockedRelationship = await BlockedUser_1.default.exists({
        $or: [
            { blockerId: new mongoose_1.Types.ObjectId(buyerId), blockedId: new mongoose_1.Types.ObjectId(sellerId) },
            { blockerId: new mongoose_1.Types.ObjectId(sellerId), blockedId: new mongoose_1.Types.ObjectId(buyerId) },
        ],
    });
    if (blockedRelationship) {
        logger_1.default.warn('[BlockGuard] Chat start denied due to block relationship', { buyerId, sellerId, adId });
        throw Object.assign(new Error('Chat unavailable due to block settings'), { status: 403, code: 'USER_BLOCKED' });
    }
    const existing = await Conversation_1.Conversation.findOne({ adId, buyerId }).lean();
    if (existing) {
        await Conversation_1.Conversation.updateOne({ _id: existing._id }, { $pull: { deletedFor: new mongoose_1.Types.ObjectId(buyerId) } });
        return { conversationId: String(existing._id), isNew: false };
    }
    const conv = await Conversation_1.Conversation.create({
        adId: new mongoose_1.Types.ObjectId(adId),
        buyerId: new mongoose_1.Types.ObjectId(buyerId),
        sellerId: new mongoose_1.Types.ObjectId(sellerId),
        isAdClosed: (0, ChatAvailabilityService_1.isListingChatClosed)(ad),
    });
    return { conversationId: String(conv._id), isNew: true };
}
async function listConversations(userId, before, view = 'active') {
    const query = {
        $or: [{ buyerId: userId }, { sellerId: userId }],
    };
    query.deletedFor = view === 'archived' ? userId : { $ne: userId };
    if (before) {
        query.lastMessageAt = { $lt: new Date(before) };
    }
    const convs = await Conversation_1.Conversation.find(query)
        .sort({ lastMessageAt: -1 })
        .limit(ChatUtils_1.PAGE_SIZE_INBOX)
        .populate('adId', 'title images price status listingType seoSlug isDeleted isChatLocked')
        .populate('buyerId', 'name avatar')
        .populate('sellerId', 'name avatar')
        .lean();
    const lastConv = convs[convs.length - 1];
    const nextCursor = convs.length === ChatUtils_1.PAGE_SIZE_INBOX && lastConv?.lastMessageAt
        ? lastConv.lastMessageAt.toISOString()
        : undefined;
    return {
        convs: convs.map((conversation) => (0, ChatUtils_1.toConversationDto)(conversation, userId)),
        nextCursor,
    };
}
async function getConversationForUser(conversationId, userId) {
    const conv = await Conversation_1.Conversation.findOne({
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
    return (0, ChatUtils_1.toConversationDto)(conv, userId);
}
async function blockConversation(conversationId, userId) {
    const conv = await Conversation_1.Conversation.findById(conversationId).lean();
    if (!conv)
        throw Object.assign(new Error('Conversation not found'), { status: 404 });
    const isBuyer = String(conv.buyerId) === userId;
    const isSeller = String(conv.sellerId) === userId;
    if (!isBuyer && !isSeller)
        throw Object.assign(new Error('Forbidden'), { status: 403 });
    await Conversation_1.Conversation.updateOne({ _id: conversationId }, { $set: { isBlocked: true, blockedBy: new mongoose_1.Types.ObjectId(userId) } });
}
async function assertConversationMember(conversationId, userId) {
    const conv = await Conversation_1.Conversation.findById(conversationId).lean();
    if (!conv)
        throw Object.assign(new Error('Conversation not found'), { status: 404 });
    const isMember = String(conv.buyerId) === userId || String(conv.sellerId) === userId;
    if (!isMember)
        throw Object.assign(new Error('Forbidden'), { status: 403 });
}
async function hideConversation(conversationId, userId) {
    await assertConversationMember(conversationId, userId);
    await Conversation_1.Conversation.updateOne({ _id: conversationId }, { $addToSet: { deletedFor: new mongoose_1.Types.ObjectId(userId) } });
}
async function restoreConversation(conversationId, userId) {
    await assertConversationMember(conversationId, userId);
    await Conversation_1.Conversation.updateOne({ _id: conversationId }, { $pull: { deletedFor: new mongoose_1.Types.ObjectId(userId) } });
}
//# sourceMappingURL=ChatConversationService.js.map