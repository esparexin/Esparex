import logger from '@esparex/core/utils/logger';
import { Request, Response } from 'express';
import { sendErrorResponse } from "@esparex/core/utils/errorResponse";
import { respond } from "@esparex/core/utils/respond";
import { getErrorMessage } from './shared';
import * as invoiceService from '@esparex/core/services/InvoiceService';

export const getInvoices = async (req: Request, res: Response) => {
    try {
        if (!req.user) return sendErrorResponse(req, res, 401, 'Unauthorized');
        const { q, status } = req.query;

        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
        const page = Math.min(1000, Math.max(1, Number(req.query.page) || 1));
        const skip = (page - 1) * limit;

        const { items, total } = await invoiceService.getInvoices(
            {
                userId: (req.user)._id.toString(),
                search: typeof q === 'string' ? q : undefined,
                status: typeof status === 'string' ? status : undefined
            },
            { limit, skip }
        );

        res.json(respond({
            success: true,
            data: items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + items.length < total
            }
        }));
    } catch (error: unknown) {
        logger.error('Get invoices error:', getErrorMessage(error));
        sendErrorResponse(req, res, 500, 'Failed to fetch invoices');
    }
};

export const getInvoiceById = async (req: Request, res: Response) => {
    try {
        if (!req.user) return sendErrorResponse(req, res, 401, 'Unauthorized');
        const { id } = req.params;
        if (!id || typeof id !== 'string') return sendErrorResponse(req, res, 400, 'Invoice ID is required');

        const invoice = await invoiceService.getInvoiceById(id, (req.user)._id.toString());
        if (!invoice) {
            return sendErrorResponse(req, res, 404, 'Invoice not found');
        }
        res.json(respond({ success: true, data: invoice }));
    } catch {
        sendErrorResponse(req, res, 500, 'Failed to fetch invoice');
    }
};
