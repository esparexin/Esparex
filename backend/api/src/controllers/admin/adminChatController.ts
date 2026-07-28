import { Request, Response } from 'express';
import logger from '@esparex/core/utils/logger';
import mongoose from 'mongoose';
import {
    adminListConversations,
    adminGetConversation,
    adminMuteConversation,
    adminExportConversation
} from '@esparex/core/services/chat/ChatAdminService';
import { logAdminAction } from '../../utils/adminLogger';

export const getAdminChats = async (req: Request, res: Response) => {
    try {
        const filter = String(req.query.filter || 'all');
        const riskMin = Number(req.query.riskMin) || 0;
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
        const q = String(req.query.q || req.query.search || '');

        const { convs, total } = await adminListConversations(filter, riskMin, page, limit, q);

        return res.status(200).json({
            success: true,
            data: convs,
            total,
            page,
            limit
        });
    } catch (error) {
        logger.error('[AdminChatController] getAdminChats error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch admin chats',
            status: 500
        });
    }
};

export const getAdminChatById = async (req: Request, res: Response) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid conversation ID format',
                status: 400
            });
        }

        const data = await adminGetConversation(id);
        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        const status = (error as { status?: number }).status || 500;
        const message = error instanceof Error ? error.message : 'Failed to fetch conversation';
        if (status >= 500) {
            logger.error('[AdminChatController] getAdminChatById error:', error);
        }
        return res.status(status).json({
            success: false,
            error: message,
            status
        });
    }
};

export const muteAdminChat = async (req: Request, res: Response) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { reason } = req.body || {};
        const adminId = (req as Request & { adminId?: string; user?: { id?: string } }).adminId ||
            (req as Request & { user?: { id?: string } }).user?.id ||
            'system';

        if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid conversation ID format',
                status: 400
            });
        }

        await adminMuteConversation(id, adminId, reason ? String(reason) : undefined);

        void logAdminAction(req, 'CHAT_MUTE', 'Conversation', new mongoose.Types.ObjectId(id));

        return res.status(200).json({
            success: true,
            message: 'Conversation muted successfully'
        });
    } catch (error) {
        const status = (error as { status?: number }).status || 500;
        const message = error instanceof Error ? error.message : 'Failed to mute conversation';
        if (status >= 500) {
            logger.error('[AdminChatController] muteAdminChat error:', error);
        }
        return res.status(status).json({
            success: false,
            error: message,
            status
        });
    }
};

export const exportAdminChat = async (req: Request, res: Response) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid conversation ID format',
                status: 400
            });
        }

        const data = await adminExportConversation(id);

        void logAdminAction(req, 'CHAT_EXPORT', 'Conversation', new mongoose.Types.ObjectId(id));

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        const status = (error as { status?: number }).status || 500;
        const message = error instanceof Error ? error.message : 'Failed to export conversation';
        if (status >= 500) {
            logger.error('[AdminChatController] exportAdminChat error:', error);
        }
        return res.status(status).json({
            success: false,
            error: message,
            status
        });
    }
};
