import logger from '../../utils/logger';
import { Request, Response } from 'express';
import { respond } from '../../utils/respond';
import { ApiResponse } from '../../../../shared/types/Api';
import { sendErrorResponse } from '../../utils/errorResponse';
import { InvoiceUser } from './shared';
import { getUserTransactions, getTransactionWithUser } from '../../services/TransactionService';
import { getActivePlans } from '../../services/PlanService';
import { getInvoiceByIdOrTransaction } from '../../services/InvoiceService';

/**
 * 3. GET PLANS
 * Fetches all active plans.
 */
export const getPlans = async (req: Request, res: Response) => {
    try {
        const { type, userType } = req.query;
        const query: Record<string, unknown> = { active: true };

        if (typeof type === 'string' && type.trim()) {
            query.type = type.trim().toUpperCase();
        }

        if (typeof userType === 'string' && userType.trim()) {
            query.userType = { $in: [userType.trim(), 'both'] };
        }

        const plans = await getActivePlans(query);
        res.json(respond<ApiResponse<unknown>>({
            success: true,
            data: plans
        }));
    } catch (error: unknown) {
        const err = error as Error;
        logger.error('Get Plans Error:', err);
        sendErrorResponse(req, res, 500, 'Failed to fetch plans');
    }
};

/**
 * 4. GET PURCHASE HISTORY
 * Fetches all transactions for the logged-in user.
 */
export const getPurchaseHistory = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return sendErrorResponse(req, res, 401, 'Unauthorized');
        }

        const transactions = await getUserTransactions(req.user._id);

        res.json(respond<ApiResponse<unknown>>({
            success: true,
            data: transactions
        }));
    } catch (error: unknown) {
        const err = error as Error;
        logger.error('Get Purchase History Error:', err);
        sendErrorResponse(req, res, 500, 'Failed to fetch purchase history');
    }
};

export const getInvoice = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return sendErrorResponse(req, res, 401, 'Unauthorized');
        }
        const id = req.params.id as string;

        const invoice = await getInvoiceByIdOrTransaction(id);

        if (invoice) {
            const ownerId = invoice.userId?.toString?.() ?? String(invoice.userId);
            if (ownerId !== req.user._id.toString() && !['admin', 'super_admin'].includes(req.user.role)) {
                return sendErrorResponse(req, res, 403, 'Unauthorized');
            }

            if (invoice.pdfUrl) {
                return res.redirect(invoice.pdfUrl);
            }
        }

        const transactionId = invoice?.transactionId?.toString?.() ?? String(invoice?.transactionId ?? id);
        const transaction = await getTransactionWithUser(transactionId);

        if (!transaction) {
            return sendErrorResponse(req, res, 404, 'Invoice not found');
        }

        const user = transaction.userId as unknown as InvoiceUser;

        if (user._id.toString() !== req.user._id.toString() && !['admin', 'super_admin'].includes(req.user.role)) {
            return sendErrorResponse(req, res, 403, 'Unauthorized');
        }

        const date = new Date(transaction.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        const planName = transaction.planSnapshot?.name || transaction.description || 'Custom Service';
        const planType = transaction.planSnapshot?.type || 'Service';
        const orderId = transaction.gatewayOrderId || transaction.gatewayPaymentId || '-';

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Invoice #${String(transaction._id)}</title>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; background: #fff; }
                .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                .logo { font-size: 24px; font-weight: bold; color: #2563EB; }
                .invoice-details { text-align: right; }
                .invoice-details h1 { margin: 0 0 10px; color: #333; }
                .meta { margin-bottom: 40px; display: flex; justify-content: space-between; }
                .bill-to h3, .bill-from h3 { margin-top: 0; color: #555; font-size: 14px; text-transform: uppercase; }
                .bill-to p, .bill-from p { margin: 5px 0; font-size: 14px; color: #666; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th { text-align: left; padding: 15px; background: #f9fafb; border-bottom: 1px solid #eee; font-size: 12px; text-transform: uppercase; color: #666; }
                td { padding: 15px; border-bottom: 1px solid #eee; font-size: 14px; }
                .total-row td { font-weight: bold; border-top: 2px solid #333; border-bottom: none; font-size: 16px; }
                .footer { text-align: center; margin-top: 60px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
                .status-badge { display: inline-block; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; background: #dcfce7; color: #166534; margin-top: 5px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">Esparex</div>
                <div class="invoice-details">
                    <h1>INVOICE</h1>
                    <p><strong>Invoice #:</strong> ${String(transaction._id)}</p>
                    <p><strong>Date:</strong> ${date}</p>
                    <div class="status-badge">PAID</div>
                </div>
            </div>

            <div class="meta">
                <div class="bill-from">
                    <h3>Bill From</h3>
                    <p><strong>Esparex Inc.</strong></p>
                    <p>123 Tech Park, Sector 5</p>
                    <p>Bangalore, KA 560100</p>
                    <p>support@esparex.com</p>
                </div>
                <div class="bill-to">
                    <h3>Bill To</h3>
                    <p><strong>${user.name || 'Valued Customer'}</strong></p>
                    <p>${user.email}</p>
                    <p>${user.mobile || ''}</p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Plan Type</th>
                        <th style="text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <strong>${planName}</strong><br>
                            <span style="color: #777; font-size: 12px;">Order ID: ${orderId}</span>
                        </td>
                        <td>${planType}</td>
                        <td style="text-align: right;">${(transaction.amount / 1).toLocaleString('en-IN', { style: 'currency', currency: transaction.currency })}</td>
                    </tr>
                    </tr>
                </tbody>
                <tfoot>
                    <tr class="total-row">
                        <td colspan="2" style="text-align: right;">Total</td>
                        <td style="text-align: right;">${(transaction.amount / 1).toLocaleString('en-IN', { style: 'currency', currency: transaction.currency })}</td>
                    </tr>
                </tfoot>
            </table>

            <div class="footer">
                <p>Thank you for your business!</p>
                <p>This is a computer-generated invoice and does not require a signature.</p>
            </div>
        </body>
        </html>
        `;

        res.setHeader('X-Esparex-Response-Mode', 'html-printable');
        res.setHeader('Content-Type', 'text/html');
        res.send(html);

    } catch (error: unknown) {
        const err = error as Error;
        logger.error('Get Invoice Error:', err);
        sendErrorResponse(req, res, 500, 'Failed to generate invoice');
    }
};
