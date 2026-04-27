"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminListConversations = adminListConversations;
exports.adminGetConversation = adminGetConversation;
exports.adminDeleteMessage = adminDeleteMessage;
exports.adminMuteConversation = adminMuteConversation;
exports.adminExportConversation = adminExportConversation;
exports.resolveReport = resolveReport;
const mongoose_1 = require("mongoose");
const Conversation_1 = require("@core/models/Conversation");
const ChatMessage_1 = require("@core/models/ChatMessage");
const ChatReport_1 = require("@core/models/ChatReport");
const Ad_1 = __importDefault(require("@core/models/Ad"));
const User_1 = require("@core/models/User");
const stringUtils_1 = require("@core/utils/stringUtils");
const chatAvailabilityService_1 = require("../chatAvailabilityService");
const ChatUtils_1 = require("./ChatUtils");
async function adminListConversations(filter, riskMin, page, limit, q) {
    const query = {};
    if (filter === 'blocked')
        query.isBlocked = true;
    if (filter === 'closed') {
        const closedAdIds = await Ad_1.default.distinct('_id', {
            $or: [
                { status: { $in: [...chatAvailabilityService_1.CHAT_CLOSED_STATUSES] } },
                { isDeleted: true },
                { isChatLocked: true },
            ],
        });
        query.adId = { $in: closedAdIds };
    }
    if (filter === 'high_risk') {
        const highRiskMsgConvIds = await ChatMessage_1.ChatMessage.distinct('conversationId', {
            riskScore: { $gte: riskMin },
        });
        query._id = { $in: highRiskMsgConvIds };
    }
    if (filter === 'reported') {
        const reportedConvIds = await ChatReport_1.ChatReport.distinct('conversationId');
        query._id = { $in: reportedConvIds };
    }
    const normalizedSearch = q.trim();
    if (normalizedSearch) {
        const searchRegex = new RegExp((0, stringUtils_1.escapeRegExp)(normalizedSearch), 'i');
        const [userMatches, adMatches] = await Promise.all([
            User_1.User.find({
                $or: [
                    { name: searchRegex },
                    { mobile: searchRegex },
                ],
            })
                .select('_id')
                .limit(50)
                .lean(),
            Ad_1.default.find({ title: searchRegex })
                .select('_id')
                .limit(50)
                .lean(),
        ]);
        const userIds = userMatches.map((user) => user._id);
        const adIds = adMatches.map((ad) => ad._id);
        const searchConditions = [];
        if (mongoose_1.Types.ObjectId.isValid(normalizedSearch)) {
            const objectId = new mongoose_1.Types.ObjectId(normalizedSearch);
            searchConditions.push({ _id: objectId }, { buyerId: objectId }, { sellerId: objectId }, { adId: objectId });
        }
        if (userIds.length > 0) {
            searchConditions.push({ buyerId: { $in: userIds } }, { sellerId: { $in: userIds } });
        }
        if (adIds.length > 0) {
            searchConditions.push({ adId: { $in: adIds } });
        }
        query.$and = [
            ...(Array.isArray(query.$and) ? query.$and : []),
            searchConditions.length > 0
                ? { $or: searchConditions }
                : { _id: { $in: [] } },
        ];
    }
    const skip = (page - 1) * limit;
    const [rawConvs, total] = await Promise.all([
        Conversation_1.Conversation.find(query)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('buyerId', 'name mobile')
            .populate('sellerId', 'name mobile')
            .populate('adId', 'title status isDeleted isChatLocked')
            .lean()
            .then((conversations) => conversations),
        Conversation_1.Conversation.countDocuments(query),
    ]);
    return { convs: rawConvs.map(ChatUtils_1.shapeConv), total };
}
async function adminGetConversation(conversationId) {
    const conv = await Conversation_1.Conversation.findById(conversationId)
        .populate('buyerId', 'name mobile avatar')
        .populate('sellerId', 'name mobile avatar')
        .populate('adId', 'title images price status listingType seoSlug isDeleted isChatLocked')
        .lean();
    if (!conv)
        throw Object.assign(new Error('Conversation not found'), { status: 404 });
    const messages = await ChatMessage_1.ChatMessage.find({ conversationId })
        .sort({ createdAt: 1 })
        .limit(200)
        .lean();
    const reports = await ChatReport_1.ChatReport.find({ conversationId }).lean();
    return { conv, messages, reports };
}
async function adminDeleteMessage(messageId, adminId, reason) {
    const msg = await ChatMessage_1.ChatMessage.findById(messageId);
    if (!msg)
        throw Object.assign(new Error('Message not found'), { status: 404 });
    await ChatMessage_1.ChatMessage.create({
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        text: `[Message removed by admin${reason ? ': ' + reason : ''}]`,
        isSystemMessage: true,
        riskScore: 0,
    });
    await ChatMessage_1.ChatMessage.deleteOne({ _id: messageId });
}
async function adminMuteConversation(conversationId, adminId, reason) {
    const conv = await Conversation_1.Conversation.findById(conversationId);
    if (!conv)
        throw Object.assign(new Error('Conversation not found'), { status: 404 });
    conv.isBlocked = true;
    conv.blockedBy = new mongoose_1.Types.ObjectId(adminId);
    await conv.save();
    await ChatMessage_1.ChatMessage.create({
        conversationId: new mongoose_1.Types.ObjectId(conversationId),
        senderId: new mongoose_1.Types.ObjectId(adminId),
        receiverId: conv.buyerId,
        text: `This conversation has been restricted by Esparex support${reason ? ': ' + reason : ''}.`,
        isSystemMessage: true,
        riskScore: 0,
    });
}
async function adminExportConversation(conversationId) {
    const { conv, messages, reports } = await adminGetConversation(conversationId);
    return { conversationId, exportedAt: new Date().toISOString(), conv, messages, reports };
}
async function resolveReport(reportId, adminId, status, adminNote) {
    const report = await ChatReport_1.ChatReport.findById(reportId);
    if (!report)
        throw Object.assign(new Error('Report not found'), { status: 404 });
    if (report.status === 'resolved' || report.status === 'dismissed') {
        throw Object.assign(new Error('Report is already closed'), { status: 400 });
    }
    report.status = status;
    report.resolvedBy = new mongoose_1.Types.ObjectId(adminId);
    report.resolvedAt = new Date();
    if (adminNote)
        report.adminAction = adminNote;
    await report.save();
    return report;
}
//# sourceMappingURL=ChatAdminService.js.map