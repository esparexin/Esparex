/**
 * ESPAREX — CANONICAL WALLET QUERY CONTROLLER (SSOT)
 *
 * Single Source of Truth for user-facing wallet read operations.
 * Extracted from:
 *   - backend/src/controllers/wallet/walletQueryController.ts
 *   - backend/admin/src/controllers/wallet/walletQueryController.ts
 *
 * Both workspace files now re-export from here.
 */
import { Request, Response } from 'express';
import { respond } from '@core/utils/respond';
import { sendErrorResponse } from '@core/utils/errorResponse';
import {
    getPostingBalanceByUserId,
    getTransactionHistoryByUserId,
    getWalletSummaryByUserId,
} from '@core/services/wallet/WalletQueryService';

const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : 'Unexpected error';

export const getWalletSummary = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');

        const wallet = await getWalletSummaryByUserId(userId.toString());

        res.json(respond({ success: true, data: wallet }));
    } catch (error: unknown) {
        sendErrorResponse(req, res, 500, getErrorMessage(error));
    }
};

export const getTransactionHistory = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');

        const limit = Number(req.query.limit) || 10;
        const skip = Number(req.query.skip) || 0;
        const history = await getTransactionHistoryByUserId(userId.toString(), { limit, skip });

        res.json(respond({ success: true, data: history }));
    } catch (error: unknown) {
        sendErrorResponse(req, res, 500, getErrorMessage(error));
    }
};

export const getPostingBalance = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id?.toString();
        if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');

        const balance = await getPostingBalanceByUserId(userId);
        res.json(respond({ success: true, data: balance }));
    } catch (error: unknown) {
        sendErrorResponse(req, res, 500, getErrorMessage(error));
    }
};
