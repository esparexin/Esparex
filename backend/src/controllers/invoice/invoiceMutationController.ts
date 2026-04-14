import logger from '../../utils/logger';
import { Request, Response } from 'express';
import { createInvoiceRecord } from '../../services/InvoiceService';
import { findUserByEmail } from '../../services/UserService';
import { sendErrorResponse } from '../../utils/errorResponse';
import { respond } from '../../utils/respond';
import { getErrorMessage } from './shared';
import { generateInvoiceNumber } from '../../utils/invoiceNumber';

export const createInvoice = async (req: Request, res: Response) => {
    try {
        if (!req.user) return sendErrorResponse(req, res, 401, 'Unauthorized');
        const {
            customerName,
            customerEmail,
            customerGst,
            items,
            isGstInvoice,
            currency = 'INR'
        } = req.body;

        if (!customerName || !items || !items.length) {
            return sendErrorResponse(req, res, 400, 'Missing required fields');
        }

        let subTotal = 0;
        const processedItems = items.map((item: { description: string, quantity: number, unitPrice: number }) => {
            const quantity = Number(item.quantity) || 0;
            const unitPrice = Number(item.unitPrice) || 0;
            const total = quantity * unitPrice;
            subTotal += total;
            return {
                description: item.description,
                quantity,
                unitPrice,
                total
            };
        });

        const taxRate = isGstInvoice ? 0.18 : 0;
        const taxAmount = subTotal * taxRate;
        const grandTotal = subTotal + taxAmount;

        const user = await findUserByEmail(customerEmail);

        if (!user) {
            return sendErrorResponse(req, res, 400, 'Customer email not found. Please register the user first.');
        }

        const newInvoice = await createInvoiceRecord({
            invoiceNumber: await generateInvoiceNumber(),
            userId: user._id,
            amount: grandTotal,
            currency,
            status: 'PENDING',
            items: processedItems,
            billingAddress: {
                line1: customerName,
                country: 'India'
            },
            isGstInvoice,
            gstin: customerGst,
            sacCode: '998599',
            subtotal: subTotal,
            total: grandTotal,
            cgst: isGstInvoice ? taxAmount / 2 : 0,
            sgst: isGstInvoice ? taxAmount / 2 : 0,
            igst: 0,
            tax: {
                gst: taxAmount,
                total: grandTotal
            },
            issuedAt: new Date()
        });

        res.status(201).json(respond({ success: true, data: newInvoice }));

    } catch (error: unknown) {
        logger.error('Create invoice error:', getErrorMessage(error));
        sendErrorResponse(req, res, 500, 'Failed to create invoice');
    }
};
