/**
 * ESPAREX — Chat Routes
 * All mounted under /api/v1/chat
 *
 * User routes: require user JWT (protect middleware)
 */
import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  chatSendLimiter,
  chatStartLimiter,
  chatReportLimiter,
} from '../middleware/rateLimiter';
import {
  startChat,
  getChatList,
  getChatConversation,
  getConversationMessages,
  sendChatMessage,
  markChatRead,
  blockChat,
  hideChat,
  unhideChat,
  reportChat,
  getChatUploadUrl,
} from '../controllers/chat/chatController';

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
 * Generate direct-upload URL for chat attachments.
 */
router.post('/upload-url', protect, chatSendLimiter, getChatUploadUrl);

/**
 * GET /api/v1/chat/:id
 * Single conversation detail for a participant.
 */
router.get('/:id', protect, getChatConversation);

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
 * POST /api/v1/chat/unhide
 * Restore an archived conversation back to the inbox.
 */
router.post('/unhide', protect, unhideChat);

/**
 * POST /api/v1/chat/report
 * Report a conversation or specific message.
 */
router.post('/report', protect, chatReportLimiter, reportChat);

export default router;
