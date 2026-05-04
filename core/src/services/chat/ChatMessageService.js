"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessages = getMessages;
exports.sendMessage = sendMessage;
exports.markRead = markRead;
const mongoose_1 = require("mongoose");
const Conversation_1 = require("@core/models/Conversation");
const ChatMessage_1 = require("@core/models/ChatMessage");
const Ad_1 = __importDefault(require("@core/models/Ad"));
const ChatAvailabilityService_1 = require("../ChatAvailabilityService");
const logger_1 = __importDefault(require("@core/utils/logger"));
const notificationType_1 = require("@core/constants/enums/notificationType");
const ChatUtils_1 = require("./ChatUtils");
async function getMessages(conversationId, userId, before, after) {
    const baseFilter = {
        conversationId,
        deletedFor: { $ne: new mongoose_1.Types.ObjectId(userId) },
    };
    if (after) {
        const msgs = await ChatMessage_1.ChatMessage.find({
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
    const msgs = await ChatMessage_1.ChatMessage.find(baseFilter)
        .sort({ createdAt: -1 })
        .limit(ChatUtils_1.PAGE_SIZE_MESSAGES)
        .lean();
    const lastMsg = msgs[msgs.length - 1];
    const nextCursor = msgs.length === ChatUtils_1.PAGE_SIZE_MESSAGES && lastMsg?.createdAt
        ? (lastMsg.createdAt).toISOString()
        : undefined;
    return { msgs: msgs.reverse(), nextCursor };
}
async function sendMessage(conversationId, senderId, rawText, attachments = []) {
    const conv = await Conversation_1.Conversation.findById(conversationId);
    if (!conv)
        throw Object.assign(new Error('Conversation not found'), { status: 404 });
    const listing = await Ad_1.default.findById(conv.adId).select('status isDeleted isChatLocked').lean();
    const derivedClosed = (0, ChatAvailabilityService_1.isListingChatClosed)(listing);
    if (conv.isAdClosed !== derivedClosed) {
        conv.isAdClosed = derivedClosed;
        await conv.save();
    }
    const buyerStr = String(conv.buyerId);
    const sellerStr = String(conv.sellerId);
    if (senderId !== buyerStr && senderId !== sellerStr) {
        throw Object.assign(new Error('Forbidden'), { status: 403 });
    }
    if (conv.isBlocked)
        throw Object.assign(new Error('This chat has been blocked'), { status: 403, code: 'CHAT_BLOCKED' });
    if (derivedClosed)
        throw Object.assign(new Error('This ad is closed — chat is read-only'), { status: 403, code: 'CHAT_CLOSED' });
    const receiverId = senderId === buyerStr ? sellerStr : buyerStr;
    const sanitized = (0, ChatUtils_1.sanitizeText)(rawText);
    const badWordDetected = (0, ChatUtils_1.detectBadWords)(sanitized);
    const riskScore = (0, ChatUtils_1.computeRiskScore)(sanitized);
    const storedText = (0, ChatUtils_1.maskSensitiveData)(sanitized);
    const msg = await ChatMessage_1.ChatMessage.create({
        conversationId: new mongoose_1.Types.ObjectId(conversationId),
        senderId: new mongoose_1.Types.ObjectId(senderId),
        receiverId: new mongoose_1.Types.ObjectId(receiverId),
        text: storedText,
        attachments,
        riskScore,
        badWordDetected,
    });
    const unreadField = receiverId === buyerStr ? 'unreadBuyer' : 'unreadSeller';
    await Conversation_1.Conversation.updateOne({ _id: conversationId }, {
        $set: {
            lastMessage: (0, ChatUtils_1.buildConversationPreview)(storedText, attachments),
            lastMessageAt: msg.createdAt,
        },
        $inc: { [unreadField]: 1 },
        $pull: { deletedFor: new mongoose_1.Types.ObjectId(senderId) },
    });
    // 📣 NOTIFY RECEIVER (Push + In-App)
    void (async () => {
        try {
            const { dispatchTemplatedNotification } = await Promise.resolve().then(() => __importStar(require('../NotificationService')));
            const UserModel = (await Promise.resolve().then(() => __importStar(require('@core/models/User')))).default;
            const senderSnippet = await UserModel.findById(senderId).select('name').lean();
            await dispatchTemplatedNotification(receiverId, notificationType_1.NOTIFICATION_TYPE.CHAT, 'NEW_CHAT_MESSAGE', {
                senderName: senderSnippet?.name || 'User',
                text: storedText.length > 50 ? `${storedText.substring(0, 47)}...` : storedText
            }, { conversationId, type: 'chat_message' });
        }
        catch (err) {
            logger_1.default.error('Failed to dispatch chat notification', { error: err });
        }
    })();
    if (riskScore >= 0.8) {
        await ChatMessage_1.ChatMessage.create({
            conversationId: new mongoose_1.Types.ObjectId(conversationId),
            senderId: new mongoose_1.Types.ObjectId(senderId),
            receiverId: new mongoose_1.Types.ObjectId(receiverId),
            text: '⚠️ This message was flagged for review by our safety system.',
            isSystemMessage: true,
            riskScore: 0,
        });
    }
    return msg;
}
async function markRead(conversationId, userId) {
    const conv = await Conversation_1.Conversation.findById(conversationId).lean();
    if (!conv)
        throw Object.assign(new Error('Conversation not found'), { status: 404 });
    const buyerStr = String(conv.buyerId);
    const sellerStr = String(conv.sellerId);
    if (userId !== buyerStr && userId !== sellerStr) {
        throw Object.assign(new Error('Forbidden'), { status: 403 });
    }
    const now = new Date();
    await ChatMessage_1.ChatMessage.updateMany({ conversationId, receiverId: new mongoose_1.Types.ObjectId(userId), readAt: null }, { $set: { readAt: now } });
    const unreadField = userId === buyerStr ? 'unreadBuyer' : 'unreadSeller';
    await Conversation_1.Conversation.updateOne({ _id: conversationId }, { $set: { [unreadField]: 0 } });
}
//# sourceMappingURL=ChatMessageService.js.map