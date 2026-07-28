import express from 'express';
import { requireAdmin, requirePermission } from '../middleware/adminAuth';
import { validateObjectId } from '../middleware/validateObjectId';
import {
    getAdminChats,
    getAdminChatById,
    muteAdminChat,
    exportAdminChat
} from '../controllers/admin/adminChatController';

const router = express.Router();

// Require authenticated admin user for all endpoints
router.use(requireAdmin);

/**
 * GET /api/v1/admin/chat/list & GET /api/v1/admin/chat
 * Paginated list of user conversations for moderation & oversight.
 */
router.get('/list', requirePermission('chat:read'), getAdminChats);
router.get('/', requirePermission('chat:read'), getAdminChats);

/**
 * GET /api/v1/admin/chat/:id
 * Single conversation detail with messages and reports.
 */
router.get('/:id', requirePermission('chat:read'), validateObjectId, getAdminChatById);

/**
 * POST /api/v1/admin/chat/mute/:id & POST /api/v1/admin/chat/:id/mute
 * Restrict/mute a conversation for all participants.
 */
router.post('/mute/:id', requirePermission('chat:write'), validateObjectId, muteAdminChat);
router.post('/:id/mute', requirePermission('chat:write'), validateObjectId, muteAdminChat);

/**
 * POST /api/v1/admin/chat/export/:id & POST /api/v1/admin/chat/:id/export
 * Export full conversation payload for compliance & investigation.
 */
router.post('/export/:id', requirePermission('chat:write'), validateObjectId, exportAdminChat);
router.post('/:id/export', requirePermission('chat:write'), validateObjectId, exportAdminChat);

export default router;
