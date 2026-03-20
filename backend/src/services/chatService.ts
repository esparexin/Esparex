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
import logger from '../utils/logger';

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
  const ad = await Ad.findById(adId).select('sellerId status').lean();
  if (!ad) throw Object.assign(new Error('Ad not found'), { status: 404 });

  const sellerId = String(ad.sellerId);
  if (sellerId === buyerId) {
    throw Object.assign(new Error('You cannot chat with yourself'), { status: 400 });
  }

  if (ad.status === 'deleted' || ad.status === 'inactive') {
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
  if (existing) return { conversationId: String(existing._id), isNew: false };

  const conv = await Conversation.create({
    adId: new Types.ObjectId(adId),
    buyerId: new Types.ObjectId(buyerId),
    sellerId: new Types.ObjectId(sellerId),
    isAdClosed: ad.status === 'sold' || ad.status === 'expired',
  });

  return { conversationId: String(conv._id), isNew: true };
}

/**
 * Paginated inbox — returns conversations where userId is buyer OR seller.
 * Excludes conversations the user has soft-hidden.
 */
export async function listConversations(userId: string, before?: string) {
  const query: Record<string, unknown> = {
    $or: [{ buyerId: userId }, { sellerId: userId }],
    deletedFor: { $ne: userId },
  };
  if (before) {
    query.lastMessageAt = { $lt: new Date(before) };
  }

  const convs = await Conversation.find(query)
    .sort({ lastMessageAt: -1 })
    .limit(PAGE_SIZE_INBOX)
    .populate('adId', 'title images price status')
    .populate('buyerId', 'name avatar')
    .populate('sellerId', 'name avatar')
    .lean();

  const lastConv = convs[convs.length - 1];
  const nextCursor =
    convs.length === PAGE_SIZE_INBOX && lastConv?.lastMessageAt
      ? lastConv.lastMessageAt.toISOString()
      : undefined;

  return { convs, nextCursor };
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

  const buyerStr = String(conv.buyerId);
  const sellerStr = String(conv.sellerId);

  if (senderId !== buyerStr && senderId !== sellerStr) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  if (conv.isBlocked) throw Object.assign(new Error('This chat has been blocked'), { status: 403, code: 'CHAT_BLOCKED' });
  if (conv.isAdClosed) throw Object.assign(new Error('This ad is closed — chat is read-only'), { status: 403, code: 'CHAT_CLOSED' });

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
      $set: { lastMessage: storedText.slice(0, 120), lastMessageAt: msg.createdAt },
      $inc: { [unreadField]: 1 },
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

/**
 * Soft-hide a conversation from the caller's inbox (deletedFor).
 */
export async function hideConversation(conversationId: string, userId: string) {
  const conv = await Conversation.findById(conversationId).lean();
  if (!conv) throw Object.assign(new Error('Conversation not found'), { status: 404 });

  const isMember = [String(conv.buyerId), String(conv.sellerId)].includes(userId);
  if (!isMember) throw Object.assign(new Error('Forbidden'), { status: 403 });

  await Conversation.updateOne(
    { _id: conversationId },
    { $addToSet: { deletedFor: new Types.ObjectId(userId) } }
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

export async function adminListConversations(
  filter: string,
  riskMin: number,
  page: number,
  limit: number,
  search: string
) {
  const query: Record<string, unknown> = {};

  if (filter === 'blocked') query.isBlocked = true;
  if (filter === 'closed') query.isAdClosed = true;
  if (filter === 'high_risk') {
    // Flag conversations that have at least one high-risk message
    const highRiskMsgConvIds = await ChatMessage.distinct('conversationId', {
      riskScore: { $gte: riskMin },
    });
    query._id = { $in: highRiskMsgConvIds };
  }
  if (filter === 'reported') {
    const reportedConvIds = await ChatReport.distinct('conversationId');
    query._id = { $in: reportedConvIds };
  }

  const skip = (page - 1) * limit;
  const [convs, total] = await Promise.all([
    Conversation.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('buyerId', 'name mobile')
      .populate('sellerId', 'name mobile')
      .populate('adId', 'title')
      .lean(),
    Conversation.countDocuments(query),
  ]);

  return { convs, total };
}

export async function adminGetConversation(conversationId: string) {
  const conv = await Conversation.findById(conversationId)
    .populate('buyerId', 'name mobile avatar')
    .populate('sellerId', 'name mobile avatar')
    .populate('adId', 'title images price status')
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
