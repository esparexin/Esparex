import logger from '../../utils/logger';
import { Request, Response } from 'express';
import { sendErrorResponse } from '../../utils/errorResponse';
import { respond } from '../../utils/respond';
import { getErrorMessage } from './shared';
import * as invoiceService from '../../services/InvoiceService';

export const getInvoices = async (req: Request, res: Response) => {
    try {
        if (!req.user) return sendErrorResponse(req, res, 401, 'Unauthorized');
        const { search, status } = req.query;

        const invoices = await invoiceService.getInvoices({
            userId: req.user._id.toString(),
            search: typeof search === 'string' ? search : undefined,
            status: typeof status === 'string' ? status : undefined
        });

        res.json(respond({ success: true, data: invoices }));
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

        const invoice = await invoiceService.getInvoiceById(id, req.user._id.toString());
        if (!invoice) {
            return sendErrorResponse(req, res, 404, 'Invoice not found');
        }
        res.json(respond({ success: true, data: invoice }));
    } catch {
        sendErrorResponse(req, res, 500, 'Failed to fetch invoice');
    }
};
