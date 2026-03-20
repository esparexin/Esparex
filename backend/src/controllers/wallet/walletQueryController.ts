import { Request, Response } from 'express';
import { respond } from '../../utils/respond';
import { ApiResponse } from '../../../../shared/types/Api';
import { sendErrorResponse } from '../../utils/errorResponse';
import { getAdPostingBalance } from '../../services/PlanService';
import { getErrorMessage, TransactionModel, WalletModel } from './shared';

export const getWalletSummary = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');

        let wallet = await WalletModel.findOne({ userId }).lean();

        if (!wallet) {
            wallet = await WalletModel.create({
                userId,
                adCredits: 0,
                monthlyFreeAdsUsed: 0,
                spotlightCredits: 0,
                smartAlertSlots: 2
            });
        }

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

        const { limit = 10, skip = 0 } = req.query;

        const transactions = await TransactionModel.find({ userId })
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip))
            .lean();

        const total = await TransactionModel.countDocuments({ userId });

        res.json(respond<ApiResponse<unknown>>({
            success: true,
            data: {
                transactions,
                pagination: {
                    total,
                    limit: Number(limit),
                    skip: Number(skip)
                }
            }
        }));
    } catch (error: unknown) {
        sendErrorResponse(req, res, 500, getErrorMessage(error));
    }
};

export const getPostingBalance = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id?.toString();
        if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');

        const balance = await getAdPostingBalance(userId);
        res.json(respond<ApiResponse<unknown>>({
            success: true,
            data: balance
        }));
    } catch (error: unknown) {
        sendErrorResponse(req, res, 500, getErrorMessage(error));
    }
};
