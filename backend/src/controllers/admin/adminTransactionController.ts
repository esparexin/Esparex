import { Request, Response } from 'express';
import { 
    sendSuccessResponse, 
    sendAdminError,
    sendPaginatedResponse 
} from '../admin/adminBaseController';
import * as transactionService from '../../services/TransactionService';

/**
 * Get all transactions with pagination and filtering
 */
export const getAllTransactions = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const { status, search, startDate, endDate } = req.query;

        const { data, total } = await transactionService.getTransactions(
            {
                status: status as string,
                search: search as string,
                startDate: startDate as string,
                endDate: endDate as string
            },
            { skip, limit }
        );

        sendPaginatedResponse(res, data, total, page, limit);
    } catch (error) {
        return sendAdminError(req, res, error);
    }
};

/**
 * Get transaction statistics
 */
export const getTransactionStats = async (req: Request, res: Response) => {
    try {
        const stats = await transactionService.getTransactionStats();
        sendSuccessResponse(res, stats);
    } catch (error) {
        return sendAdminError(req, res, error);
    }
};
