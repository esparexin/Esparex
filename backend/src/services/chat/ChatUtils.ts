import type { IConversationDTO } from '@shared/contracts/chat.contracts';
import { isListingChatClosed } from '../chatAvailabilityService';
import type { IChatAttachment } from '../../models/ChatMessage';

export const PAGE_SIZE_MESSAGES = 30;
export const PAGE_SIZE_INBOX = 20;

export const DEFAULT_BLACKLIST: RegExp[] = [
    /\bscam\b/i,
    /\bfraud\b/i,
    /send.?money/i,
    /bank.?account/i,
    /western.?union/i,
    /advance.?payment/i,
];

export const PHONE_REGEX = /(\+?\d[\d\s\-().]{6,}\d)/g;
export const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
export const URL_REGEX = /https?:\/\/\S+/gi;

export function encodeHtmlEntities(raw: string): string {
    return raw
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

export function sanitizeText(raw: string): string {
    return encodeHtmlEntities(raw.trim());
}

export function detectBadWords(text: string, extra: RegExp[] = []): boolean {
    const patterns = [...DEFAULT_BLACKLIST, ...extra];
    return patterns.some((re) => re.test(text));
}

export function computeRiskScore(text: string): number {
    let score = 0;
    const urlHits = (text.match(URL_REGEX) || []).length;
    if (urlHits >= 2) score += 0.3;
    if (urlHits >= 4) score += 0.2;
    if (PHONE_REGEX.test(text)) score += 0.25;
    if (DEFAULT_BLACKLIST.some((re) => re.test(text))) score += 0.4;
    return Math.min(score, 1);
}

export function maskSensitiveData(text: string): string {
    return text
        .replace(PHONE_REGEX, '[phone hidden]')
        .replace(EMAIL_REGEX, '[email hidden]');
}

export function isImageAttachment(attachment: IChatAttachment): boolean {
    return attachment.mimeType.toLowerCase().startsWith('image/');
}

export function buildAttachmentInboxSummary(attachments: IChatAttachment[]): string | null {
    if (attachments.length === 0) return null;

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

export function buildConversationPreview(text: string, attachments: IChatAttachment[]): string {
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

export interface PopulatedUser {
    _id?: unknown;
    id?: string;
    name?: string;
    avatar?: string;
    mobile?: string;
}

export interface PopulatedAd {
    _id?: unknown;
    id?: string;
    title?: string;
    images?: string[];
    price?: number;
    listingType?: string;
    seoSlug?: string;
    status?: string;
    isDeleted?: boolean;
    isChatLocked?: boolean;
}

export interface PopulatedConv {
    _id: unknown;
    buyerId: PopulatedUser | null;
    sellerId: PopulatedUser | null;
    adId: PopulatedAd | null;
    lastMessage?: string | { text?: string } | null;
    lastMessageAt?: Date | string;
    isBlocked?: boolean;
    isAdClosed?: boolean;
    unreadBuyer?: number;
    unreadSeller?: number;
    deletedFor?: unknown[];
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export function normalizeNestedId(value?: { id?: string; _id?: unknown } | null): string {
    if (!value) return '';
    if (typeof value.id === 'string' && value.id.trim().length > 0) return value.id.trim();
    if (value._id != null) return String(value._id);
    return '';
}

export function toIso(v?: Date | string): string | undefined {
    if (!v) return undefined;
    return v instanceof Date ? v.toISOString() : v;
}

export function extractLastMessage(raw?: string | { text?: string } | null): string | undefined {
    if (!raw) return undefined;
    if (typeof raw === 'string') return raw;
    return raw.text ?? undefined;
}

export function isConversationArchivedForViewer(c: PopulatedConv, viewerId?: string): boolean {
    if (!viewerId || !Array.isArray(c.deletedFor)) return false;
    return c.deletedFor.some((entry) => {
        if (entry == null) return false;
        if (typeof entry === 'string') return entry === viewerId;
        if (typeof entry === 'object' && '_id' in (entry as Record<string, unknown>)) {
            return String((entry as { _id?: unknown })._id) === viewerId;
        }
        return String(entry) === viewerId;
    });
}

export function toConversationDto(c: PopulatedConv, viewerId?: string): IConversationDTO {
    const thumbnail = Array.isArray(c.adId?.images)
        ? c.adId.images.find((image): image is string => typeof image === 'string' && image.trim().length > 0)
        : undefined;
    const isAdClosed = isListingChatClosed(c.adId);

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

export type AdminConvSummary = {
    id: string;
    buyerName: string;
    sellerName: string;
    adTitle: string;
    lastMessage?: string;
    lastMessageAt?: string;
    isBlocked: boolean;
    isAdClosed: boolean;
    unreadBuyer: number;
    unreadSeller: number;
    updatedAt: string;
};

export function shapeConv(c: PopulatedConv): AdminConvSummary {
    return {
        id: String(c._id),
        buyerName: c.buyerId?.name ?? c.buyerId?.mobile ?? 'Unknown',
        sellerName: c.sellerId?.name ?? c.sellerId?.mobile ?? 'Unknown',
        adTitle: c.adId?.title ?? 'Untitled',
        lastMessage: extractLastMessage(c.lastMessage),
        lastMessageAt: toIso(c.lastMessageAt),
        isBlocked: Boolean(c.isBlocked),
        isAdClosed: isListingChatClosed(c.adId),
        unreadBuyer: Number(c.unreadBuyer ?? 0),
        unreadSeller: Number(c.unreadSeller ?? 0),
        updatedAt: toIso(c.updatedAt) ?? '',
    };
}
