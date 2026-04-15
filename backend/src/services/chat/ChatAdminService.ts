import { Types } from 'mongoose';
import { Conversation } from '../../models/Conversation';
import { ChatMessage } from '../../models/ChatMessage';
import { ChatReport } from '../../models/ChatReport';
import Ad from '../../models/Ad';
import { User } from '../../models/User';
import { escapeRegExp } from '../../utils/stringUtils';
import {
    CHAT_CLOSED_STATUSES,
} from '../chatAvailabilityService';
import {
    PopulatedConv,
    AdminConvSummary,
    shapeConv
} from './ChatUtils';

export async function adminListConversations(
    filter: string,
    riskMin: number,
    page: number,
    limit: number,
    search: string
): Promise<{ convs: AdminConvSummary[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filter === 'blocked') query.isBlocked = true;
    if (filter === 'closed') {
        const closedAdIds = await Ad.distinct('_id', {
            $or: [
                { status: { $in: [...CHAT_CLOSED_STATUSES] } },
                { isDeleted: true },
                { isChatLocked: true },
            ],
        });
        query.adId = { $in: closedAdIds };
    }
    if (filter === 'high_risk') {
        const highRiskMsgConvIds = await ChatMessage.distinct('conversationId', {
            riskScore: { $gte: riskMin },
        });
        query._id = { $in: highRiskMsgConvIds };
    }
    if (filter === 'reported') {
        const reportedConvIds = await ChatReport.distinct('conversationId');
        query._id = { $in: reportedConvIds };
    }

    const normalizedSearch = search.trim();
    if (normalizedSearch) {
        const searchRegex = new RegExp(escapeRegExp(normalizedSearch), 'i');
        const [userMatches, adMatches] = await Promise.all([
            User.find({
                $or: [
                    { name: searchRegex },
                    { mobile: searchRegex },
                ],
            })
                .select('_id')
                .limit(50)
                .lean(),
            Ad.find({ title: searchRegex })
                .select('_id')
                .limit(50)
                .lean(),
        ]);

        const userIds = userMatches.map((user) => user._id);
        const adIds = adMatches.map((ad) => ad._id);
        const searchConditions: Record<string, unknown>[] = [];

        if (Types.ObjectId.isValid(normalizedSearch)) {
            const objectId = new Types.ObjectId(normalizedSearch);
            searchConditions.push(
                { _id: objectId },
                { buyerId: objectId },
                { sellerId: objectId },
                { adId: objectId }
            );
        }

        if (userIds.length > 0) {
            searchConditions.push(
                { buyerId: { $in: userIds } },
                { sellerId: { $in: userIds } }
            );
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
        Conversation.find(query)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('buyerId', 'name mobile')
            .populate('sellerId', 'name mobile')
            .populate('adId', 'title status isDeleted isChatLocked')
            .lean()
            .then((conversations) => conversations as unknown as PopulatedConv[]),
        Conversation.countDocuments(query),
    ]);

    return { convs: rawConvs.map(shapeConv), total };
}

export async function adminGetConversation(conversationId: string) {
    const conv = await Conversation.findById(conversationId)
        .populate('buyerId', 'name mobile avatar')
        .populate('sellerId', 'name mobile avatar')
        .populate('adId', 'title images price status listingType seoSlug isDeleted isChatLocked')
        .lean();
    if (!conv) throw Object.assign(new Error('Conversation not found'), { status: 404 });

    const messages = await ChatMessage.find({ conversationId })
        .sort({ createdAt: 1 })
        .limit(200)
        .lean();

    const reports = await ChatReport.find({ conversationId }).lean();

    return { conv, messages, reports };
}

export async function adminDeleteMessage(
    messageId: string,
    adminId: string,
    reason?: string
) {
    const msg = await ChatMessage.findById(messageId);
    if (!msg) throw Object.assign(new Error('Message not found'), { status: 404 });

    await ChatMessage.create({
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        text: `[Message removed by admin${reason ? ': ' + reason : ''}]`,
        isSystemMessage: true,
        riskScore: 0,
    });

    await ChatMessage.deleteOne({ _id: messageId });
}

export async function adminMuteConversation(
    conversationId: string,
    adminId: string,
    reason?: string
) {
    const conv = await Conversation.findById(conversationId);
    if (!conv) throw Object.assign(new Error('Conversation not found'), { status: 404 });

    conv.isBlocked = true;
    conv.blockedBy = new Types.ObjectId(adminId);
    await conv.save();

    await ChatMessage.create({
        conversationId: new Types.ObjectId(conversationId),
        senderId: new Types.ObjectId(adminId),
        receiverId: conv.buyerId,
        text: `This conversation has been restricted by Esparex support${reason ? ': ' + reason : ''}.`,
        isSystemMessage: true,
        riskScore: 0,
    });
}

export async function adminExportConversation(conversationId: string) {
    const { conv, messages, reports } = await adminGetConversation(conversationId);
    return { conversationId, exportedAt: new Date().toISOString(), conv, messages, reports };
}

export async function resolveReport(
    reportId: string,
    adminId: string,
    status: 'resolved' | 'dismissed',
    adminNote?: string
) {
    const report = await ChatReport.findById(reportId);
    if (!report) throw Object.assign(new Error('Report not found'), { status: 404 });

    if (report.status === 'resolved' || report.status === 'dismissed') {
        throw Object.assign(new Error('Report is already closed'), { status: 400 });
    }

    report.status = status;
    report.resolvedBy = new Types.ObjectId(adminId);
    report.resolvedAt = new Date();
    if (adminNote) report.adminAction = adminNote;
    await report.save();
    return report;
}
