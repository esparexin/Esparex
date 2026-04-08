/**
 * ESPAREX — Chat Service (SSOT)
 *
 * Pure business logic, no Express req/res concerns.
 * All DB operations go through this service.
 */

import { Types } from 'mongoose';
import { Conversation } from '../models/Conversation';
import { ChatMessage } from '../models/ChatMessage';
import { ChatReport } from '../models/ChatReport';
import Ad from '../models/Ad';
import BlockedUser from '../models/BlockedUser';
import { User } from '../models/User';
import logger from '../utils/logger';
import { escapeRegExp } from '../utils/stringUtils';
import type { IConversationDTO } from '@shared/contracts/chat.contracts';
import {
  CHAT_CLOSED_STATUSES,
  isListingChatClosed,
} from './chatAvailabilityService';

/* -------------------------------------------------------------------------- */
/* Inline HTML-entity encoder (no external dep needed)                         */
/* -------------------------------------------------------------------------- */
function encodeHtmlEntities(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
import type { IChatAttachment } from '../models/ChatMessage';
import type { ChatReportReasonValue } from '@shared/enums/chatStatus';

const PAGE_SIZE_MESSAGES = 30;
const PAGE_SIZE_INBOX = 20;

/* ============================================================================
   BLACKLIST (inline defaults — admin can override via SystemConfig)
   ============================================================================ */

const DEFAULT_BLACKLIST: RegExp[] = [
  /\bscam\b/i,
  /\bfraud\b/i,
  /send.?money/i,
  /bank.?account/i,
  /western.?union/i,
  /advance.?payment/i,
];

/** Regex patterns that indicate a phone number / email — mask in delivery */
const PHONE_REGEX = /(\+?\d[\d\s\-().]{6,}\d)/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
/** URL density — if message has more than 2 raw URLs, consider high risk */
const URL_REGEX = /https?:\/\/\S+/gi;

/* ============================================================================
   HELPERS
   ============================================================================ */

function sanitizeText(raw: string): string {
  // Encode HTML entities to prevent XSS when rendered on client
  return encodeHtmlEntities(raw.trim());
}

function detectBadWords(text: string, extra: RegExp[] = []): boolean {
  const patterns = [...DEFAULT_BLACKLIST, ...extra];
  return patterns.some((re) => re.test(text));
}

function computeRiskScore(text: string): number {
  let score = 0;
  const urlHits = (text.match(URL_REGEX) || []).length;
  if (urlHits >= 2) score += 0.3;
  if (urlHits >= 4) score += 0.2;
  if (PHONE_REGEX.test(text)) score += 0.25;
  if (DEFAULT_BLACKLIST.some((re) => re.test(text))) score += 0.4;
  return Math.min(score, 1);
}

function maskSensitiveData(text: string): string {
  return text
    .replace(PHONE_REGEX, '[phone hidden]')
    .replace(EMAIL_REGEX, '[email hidden]');
}

function isImageAttachment(attachment: IChatAttachment): boolean {
  return attachment.mimeType.toLowerCase().startsWith('image/');
}

function buildAttachmentInboxSummary(attachments: IChatAttachment[]): string | null {
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

function buildConversationPreview(text: string, attachments: IChatAttachment[]): string {
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

/* ============================================================================
   CONVERSATION
   ============================================================================ */

/**
 * Create or return an existing conversation for (adId, buyerId).
 * Validates the ad exists and that the buyer is not the seller.
 */
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
      {
        blockerId: new Types.ObjectId(buyerId),
        blockedId: new Types.ObjectId(sellerId),
      },
      {
        blockerId: new Types.ObjectId(sellerId),
        blockedId: new Types.ObjectId(buyerId),
      },
    ],
  });
  if (blockedRelationship) {
    logger.warn('[BlockGuard] Chat start denied due to block relationship', {
      buyerId,
      sellerId,
      adId,
    });
    throw Object.assign(new Error('Chat unavailable due to block settings'), {
      status: 403,
      code: 'USER_BLOCKED',
    });
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

/**
 * Paginated inbox — returns conversations where userId is buyer OR seller.
 * Excludes conversations the user has soft-hidden.
 */
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

/* ============================================================================
   MESSAGES
   ============================================================================ */

/**
 * Returns messages for a conversation.
 *
 * Two modes:
 *  - `before` (scroll-up pagination): returns up to PAGE_SIZE messages OLDER than cursor, descending → reversed ascending for display.
 *  - `after`  (incremental poll):      returns ALL messages NEWER than cursor, ascending. No page limit — polling intervals keep this small.
 *
 * Only one of `before` / `after` should be supplied at a time.
 */
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
    // INCREMENTAL POLL — return only messages newer than cursor, ascending
    const msgs = await ChatMessage.find({
      ...baseFilter,
      createdAt: { $gt: new Date(after) },
    })
      .sort({ createdAt: 1 })
      .lean();
    // No cursor needed for poll mode — caller uses the last message's createdAt as next `after`
    return { msgs, nextCursor: undefined };
  }

  // BACKWARD PAGINATION — load older messages
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
      ? (lastMsg.createdAt as Date).toISOString()
      : undefined;

  // Return in ascending order for display
  return { msgs: msgs.reverse(), nextCursor };
}

/**
 * Append a new message to a conversation.
 * - Validates conversation ownership + open status.
 * - Sanitizes text, detects bad words, computes risk score.
 * - Atomically increments receiver unread counter + denormalizes last message.
 * - If riskScore >= 0.8, inserts a system warning message.
 */
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

  // Store text with sensitive data masked (buyer/seller see masked version)
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

  // Denormalize: update conversation summary + unread counter atomically
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

  // Auto warning for high-risk messages
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

/**
 * Mark all unread messages in a conversation as read (receiver's perspective).
 * Resets the unread counter for the caller.
 */
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

/**
 * Self-service block — allows a participant to block a conversation.
 * Admin block is handled in chatAdminController directly.
 */
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

async function assertConversationMember(conversationId: string, userId: string) {
  const conv = await Conversation.findById(conversationId).lean();
  if (!conv) throw Object.assign(new Error('Conversation not found'), { status: 404 });

  const isMember = String(conv.buyerId) === userId || String(conv.sellerId) === userId;
  if (!isMember) throw Object.assign(new Error('Forbidden'), { status: 403 });
}

/**
 * Soft-hide a conversation from the caller's inbox (deletedFor).
 */
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

/* ============================================================================
   REPORTING
   ============================================================================ */

export async function reportConversation(
  conversationId: string,
  reporterId: string,
  reason: ChatReportReasonValue,
  description?: string,
  messageId?: string
) {
  const conv = await Conversation.findById(conversationId).lean();
  if (!conv) throw Object.assign(new Error('Conversation not found'), { status: 404 });

  const buyerStr = String(conv.buyerId);
  const sellerStr = String(conv.sellerId);
  if (reporterId !== buyerStr && reporterId !== sellerStr) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  const reportedUserId = reporterId === buyerStr ? sellerStr : buyerStr;

  const report = await ChatReport.create({
    conversationId: new Types.ObjectId(conversationId),
    reporterId: new Types.ObjectId(reporterId),
    reportedUserId: new Types.ObjectId(reportedUserId),
    messageId: messageId ? new Types.ObjectId(messageId) : undefined,
    reason,
    description,
  });

  return report;
}

/* ============================================================================
   ADMIN SERVICES
   ============================================================================ */

export interface AdminConvSummary {
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
}

// Inline types for the populated sub-documents returned by .lean()
interface PopulatedUser {
  _id?: unknown;
  id?: string;
  name?: string;
  avatar?: string;
  mobile?: string;
}
interface PopulatedAd  {
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
interface PopulatedConv {
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

function normalizeNestedId(value?: { id?: string; _id?: unknown } | null): string {
  if (!value) return '';
  if (typeof value.id === 'string' && value.id.trim().length > 0) return value.id.trim();
  if (value._id != null) return String(value._id);
  return '';
}

function toIso(v?: Date | string): string | undefined {
  if (!v) return undefined;
  return v instanceof Date ? v.toISOString() : v;
}

function extractLastMessage(raw?: string | { text?: string } | null): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'string') return raw;
  return raw.text ?? undefined;
}

function isConversationArchivedForViewer(c: PopulatedConv, viewerId?: string): boolean {
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

function toConversationDto(c: PopulatedConv, viewerId?: string): IConversationDTO {
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

function shapeConv(c: PopulatedConv): AdminConvSummary {
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
    .limit(200) // Phase 9: cap to 200 most recent messages for safety
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

  // Insert a system replacement message so the conversation maintains context
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

  // Insert system notice inside the conversation
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

/**
 * Resolve or dismiss a ChatReport — completes the admin moderation lifecycle.
 * Allowed transitions: open/under_review → resolved | dismissed
 */
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
