"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.URL_REGEX = exports.EMAIL_REGEX = exports.PHONE_REGEX = exports.DEFAULT_BLACKLIST = exports.PAGE_SIZE_INBOX = exports.PAGE_SIZE_MESSAGES = void 0;
exports.encodeHtmlEntities = encodeHtmlEntities;
exports.sanitizeText = sanitizeText;
exports.detectBadWords = detectBadWords;
exports.computeRiskScore = computeRiskScore;
exports.maskSensitiveData = maskSensitiveData;
exports.isImageAttachment = isImageAttachment;
exports.buildAttachmentInboxSummary = buildAttachmentInboxSummary;
exports.buildConversationPreview = buildConversationPreview;
exports.normalizeNestedId = normalizeNestedId;
exports.toIso = toIso;
exports.extractLastMessage = extractLastMessage;
exports.isConversationArchivedForViewer = isConversationArchivedForViewer;
exports.toConversationDto = toConversationDto;
exports.shapeConv = shapeConv;
const chatAvailabilityService_1 = require("../chatAvailabilityService");
exports.PAGE_SIZE_MESSAGES = 30;
exports.PAGE_SIZE_INBOX = 20;
exports.DEFAULT_BLACKLIST = [
    /\bscam\b/i,
    /\bfraud\b/i,
    /send.?money/i,
    /bank.?account/i,
    /western.?union/i,
    /advance.?payment/i,
];
exports.PHONE_REGEX = /(\+?\d[\d\s\-().]{6,}\d)/g;
exports.EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
exports.URL_REGEX = /https?:\/\/\S+/gi;
function encodeHtmlEntities(raw) {
    return raw
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}
function sanitizeText(raw) {
    return encodeHtmlEntities(raw.trim());
}
function detectBadWords(text, extra = []) {
    const patterns = [...exports.DEFAULT_BLACKLIST, ...extra];
    return patterns.some((re) => re.test(text));
}
function computeRiskScore(text) {
    let score = 0;
    const urlHits = (text.match(exports.URL_REGEX) || []).length;
    if (urlHits >= 2)
        score += 0.3;
    if (urlHits >= 4)
        score += 0.2;
    if (exports.PHONE_REGEX.test(text))
        score += 0.25;
    if (exports.DEFAULT_BLACKLIST.some((re) => re.test(text)))
        score += 0.4;
    return Math.min(score, 1);
}
function maskSensitiveData(text) {
    return text
        .replace(exports.PHONE_REGEX, '[phone hidden]')
        .replace(exports.EMAIL_REGEX, '[email hidden]');
}
function isImageAttachment(attachment) {
    return attachment.mimeType.toLowerCase().startsWith('image/');
}
function buildAttachmentInboxSummary(attachments) {
    if (attachments.length === 0)
        return null;
    const imageCount = attachments.filter(isImageAttachment).length;
    if (imageCount === attachments.length) {
        return imageCount === 1 ? '📷 Photo' : `📷 ${imageCount} photos`;
    }
    if (attachments.length === 1) {
        const onlyAttachment = attachments[0];
        return `📎 ${onlyAttachment?.name?.trim() || 'Attachment'}`;
    }
    return `📎 ${attachments.length} attachments`;
}
function buildConversationPreview(text, attachments) {
    const trimmedText = text.trim();
    const attachmentSummary = buildAttachmentInboxSummary(attachments);
    if (!attachmentSummary) {
        return trimmedText.slice(0, 120);
    }
    if (!trimmedText) {
        return attachmentSummary;
    }
    const availableTextLength = Math.max(0, 120 - attachmentSummary.length - 3);
    const snippet = trimmedText.slice(0, availableTextLength).trim();
    return snippet ? `${attachmentSummary} · ${snippet}` : attachmentSummary;
}
function normalizeNestedId(value) {
    if (!value)
        return '';
    if (typeof value.id === 'string' && value.id.trim().length > 0)
        return value.id.trim();
    if (value._id != null)
        return String(value._id);
    return '';
}
function toIso(v) {
    if (!v)
        return undefined;
    return v instanceof Date ? v.toISOString() : v;
}
function extractLastMessage(raw) {
    if (!raw)
        return undefined;
    if (typeof raw === 'string')
        return raw;
    return raw.text ?? undefined;
}
function isConversationArchivedForViewer(c, viewerId) {
    if (!viewerId || !Array.isArray(c.deletedFor))
        return false;
    return c.deletedFor.some((entry) => {
        if (entry == null)
            return false;
        if (typeof entry === 'string')
            return entry === viewerId;
        if (typeof entry === 'object' && '_id' in entry) {
            return String(entry._id) === viewerId;
        }
        return String(entry) === viewerId;
    });
}
function toConversationDto(c, viewerId) {
    const thumbnail = Array.isArray(c.adId?.images)
        ? c.adId.images.find((image) => typeof image === 'string' && image.trim().length > 0)
        : undefined;
    const isAdClosed = (0, chatAvailabilityService_1.isListingChatClosed)(c.adId);
    return {
        id: String(c._id),
        ad: {
            id: normalizeNestedId(c.adId),
            title: c.adId?.title ?? 'Untitled',
            thumbnail,
            price: typeof c.adId?.price === 'number' ? c.adId.price : undefined,
            listingType: c.adId?.listingType,
            seoSlug: c.adId?.seoSlug,
        },
        buyer: {
            id: normalizeNestedId(c.buyerId),
            name: c.buyerId?.name ?? c.buyerId?.mobile ?? 'Unknown',
            avatar: c.buyerId?.avatar,
        },
        seller: {
            id: normalizeNestedId(c.sellerId),
            name: c.sellerId?.name ?? c.sellerId?.mobile ?? 'Unknown',
            avatar: c.sellerId?.avatar,
        },
        lastMessage: extractLastMessage(c.lastMessage),
        lastMessageAt: toIso(c.lastMessageAt),
        unreadBuyer: Number(c.unreadBuyer ?? 0),
        unreadSeller: Number(c.unreadSeller ?? 0),
        isBlocked: Boolean(c.isBlocked),
        isAdClosed,
        isArchivedForViewer: isConversationArchivedForViewer(c, viewerId),
        createdAt: toIso(c.createdAt) ?? '',
        updatedAt: toIso(c.updatedAt) ?? '',
    };
}
function shapeConv(c) {
    return {
        id: String(c._id),
        buyerName: c.buyerId?.name ?? c.buyerId?.mobile ?? 'Unknown',
        sellerName: c.sellerId?.name ?? c.sellerId?.mobile ?? 'Unknown',
        adTitle: c.adId?.title ?? 'Untitled',
        lastMessage: extractLastMessage(c.lastMessage),
        lastMessageAt: toIso(c.lastMessageAt),
        isBlocked: Boolean(c.isBlocked),
        isAdClosed: (0, chatAvailabilityService_1.isListingChatClosed)(c.adId),
        unreadBuyer: Number(c.unreadBuyer ?? 0),
        unreadSeller: Number(c.unreadSeller ?? 0),
        updatedAt: toIso(c.updatedAt) ?? '',
    };
}
//# sourceMappingURL=ChatUtils.js.map