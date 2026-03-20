/**
 * ESPAREX — Chat Routes
 * All mounted under /api/v1/chat
 *
 * User routes: require user JWT (protect middleware)
 * Admin routes: require admin JWT (adminAuth middleware)
 */
import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/adminAuth';
import {
  chatSendLimiter,
  chatStartLimiter,
  chatReportLimiter,
} from '../middleware/rateLimiter';
import {
  startChat,
  getChatList,
  getConversationMessages,
  sendChatMessage,
  markChatRead,
  blockChat,
  hideChat,
  reportChat,
  getChatUploadUrl,
} from '../controllers/chat/chatController';
import {
  adminListChats,
  adminGetChat,
  adminDeleteMsg,
  adminMuteChat,
  adminExportChat,
  adminResolveReport,
} from '../controllers/chat/chatAdminController';

const router = express.Router();

/* -------------------------------------------------------------------------- */
/* USER ROUTES (auth required)                                                  */
/* -------------------------------------------------------------------------- */

/**
 * POST /api/v1/chat/start
 * Start (or retrieve) a conversation for an ad.
 */
router.post('/start', protect, chatStartLimiter, startChat);

/**
 * GET /api/v1/chat/list
 * Paginated inbox of all conversations for the logged-in user.
 */
router.get('/list', protect, getChatList);

/**
 * POST /api/v1/chat/upload-url
 * Contract-safe placeholder for chat attachment upload URL generation.
 */
router.post('/upload-url', protect, chatSendLimiter, getChatUploadUrl);

/**
 * GET /api/v1/chat/:id/messages
 * Paginated messages for a conversation (reverse cursor scroll).
 */
router.get('/:id/messages', protect, getConversationMessages);

/**
 * POST /api/v1/chat/send
 * Send a new message.
 */
router.post('/send', protect, chatSendLimiter, sendChatMessage);

/**
 * POST /api/v1/chat/read
 * Mark messages in a conversation as read.
 */
router.post('/read', protect, markChatRead);

/**
 * POST /api/v1/chat/block
 * Self-service block a conversation.
 */
router.post('/block', protect, blockChat);

/**
 * POST /api/v1/chat/hide
 * Soft-hide (archive) a conversation from inbox.
 */
router.post('/hide', protect, hideChat);

/**
 * POST /api/v1/chat/report
 * Report a conversation or specific message.
 */
router.post('/report', protect, chatReportLimiter, reportChat);

/* -------------------------------------------------------------------------- */
/* ADMIN ROUTES (admin JWT required)                                           */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/v1/chat/admin/list
 * Admin: paginated list of all conversations with moderation filters.
 */
router.get('/admin/list', requireAdmin, adminListChats);

/**
 * GET /api/v1/chat/admin/:id
 * Admin: full conversation detail including messages and reports.
 */
router.get('/admin/:id', requireAdmin, adminGetChat);

/**
 * DELETE /api/v1/chat/admin/message/:msgId
 * Admin: delete (replace) a specific message.
 */
router.delete('/admin/message/:msgId', requireAdmin, adminDeleteMsg);

/**
 * POST /api/v1/chat/admin/mute/:id
 * Admin: block/mute a conversation.
 */
router.post('/admin/mute/:id', requireAdmin, adminMuteChat);

/**
 * POST /api/v1/chat/admin/export/:id
 * Admin: export full chat history as JSON.
 */
router.post('/admin/export/:id', requireAdmin, adminExportChat);

/**
 * PATCH /api/v1/chat/admin/report/:id
 * Admin: resolve or dismiss a chat report.
 */
router.patch('/admin/report/:id', requireAdmin, adminResolveReport);

export default router;
