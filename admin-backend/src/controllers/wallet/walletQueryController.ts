import { Request, Response } from 'express';
import { respond } from "@core/utils/respond";
import { ApiResponse } from '../../../../shared/types/Api';
import { sendErrorResponse } from "@core/utils/errorResponse";
import { getErrorMessage } from './shared';
import {
    getPostingBalanceByUserId,
    getTransactionHistoryByUserId,
    getWalletSummaryByUserId,
} from '@core/services/wallet/WalletQueryService';

export const getWalletSummary = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');

        const wallet = await getWalletSummaryByUserId(userId.toString());

        res.json(respond<ApiResponse<unknown>>({
            success: true,
            data: wallet
        }));
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

        res.json(respond<ApiResponse<unknown>>({
            success: true,
            data: history
        }));
    } catch (error: unknown) {
        sendErrorResponse(req, res, 500, getErrorMessage(error));
    }
};

export const getPostingBalance = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id?.toString();
        if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');

        const balance = await getPostingBalanceByUserId(userId);
        res.json(respond<ApiResponse<unknown>>({
            success: true,
            data: balance
        }));
    } catch (error: unknown) {
        sendErrorResponse(req, res, 500, getErrorMessage(error));
    }
};
