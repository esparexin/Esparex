import logger from '@esparex/core/utils/logger';
import { renderInvoiceHtml } from '@esparex/core/domains/payments/application/InvoicePdfService';
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { respond } from "../../utils/respond";
import { ApiResponse, Role } from "@esparex/contracts";
import { normalizeRole } from '@esparex/core/utils/roleNormalization';
import { formatAppDate } from '@esparex/shared';
import { sendErrorResponse } from "../../utils/errorResponse";
import { InvoiceUser } from '@esparex/core/config/razorpay';
import { getUserTransactions, getTransactionWithUser } from '@esparex/core/domains/payments/application/TransactionService';
import { getActivePlans } from '@esparex/core/domains/payments/application/PlanService';
import { getInvoiceByIdOrTransaction } from '@esparex/core/domains/payments/application/InvoiceService';
import { DashboardFacade } from '@esparex/core/domains/payments/application/DashboardFacade';
import { validateRedirectUrl } from '@esparex/core/utils/redirectValidator';

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

        const transactions = await getUserTransactions((req.user)._id);

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

        if (!id || typeof id !== 'string' || !id.trim()) {
            return sendErrorResponse(req, res, 400, 'Invalid ID Format', {
                details: { message: `Parameter 'id' is required` }
            });
        }

        const invoice = await getInvoiceByIdOrTransaction(id);

        if (invoice) {
            const ownerId = invoice.userId?.toString?.() ?? String(invoice.userId);
            const role = normalizeRole(req.user?.role);
            const isAdmin = role === Role.ADMIN || role === Role.SUPER_ADMIN;
            if (ownerId !== req.user._id.toString() && !isAdmin) {
                return sendErrorResponse(req, res, 403, 'Unauthorized');
            }

            if (invoice.pdfUrl) {
                return res.redirect(validateRedirectUrl(invoice.pdfUrl));
            }
        }

        const transactionId = invoice?.transactionId?.toString?.() ?? String(invoice?.transactionId ?? id);
        const transaction = await getTransactionWithUser(transactionId);

        if (!transaction) {
            return sendErrorResponse(req, res, 404, 'Invoice not found');
        }

        const rawUser = transaction.userId as (InvoiceUser & { _id?: Types.ObjectId }) | Types.ObjectId | null;
        const ownerId = (rawUser && typeof rawUser === 'object' && '_id' in rawUser && rawUser._id)
            ? rawUser._id.toString()
            : (rawUser?.toString() || '');
        const user = (rawUser && typeof rawUser === 'object' ? rawUser : {}) as Partial<InvoiceUser>;
        const reqUserRole = normalizeRole(req.user?.role);
        const isReqUserAdmin = reqUserRole === Role.ADMIN || reqUserRole === Role.SUPER_ADMIN;

        if (ownerId && ownerId !== req.user._id.toString() && !isReqUserAdmin) {
            return sendErrorResponse(req, res, 403, 'Unauthorized');
        }

        const date = formatAppDate(transaction.createdAt, {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        const planName = transaction.planSnapshot?.name || transaction.description || 'Custom Service';
        const planType = transaction.planSnapshot?.type || 'Service';
        const orderId = transaction.gatewayOrderId || transaction.gatewayPaymentId || '-';

        const invoiceNumber = invoice?.invoiceNumber || `INV-${new Date(transaction.createdAt).getFullYear()}${String(new Date(transaction.createdAt).getMonth() + 1).padStart(2, '0')}-${String(transaction._id).slice(-5).toUpperCase()}`;
        const subtotal = invoice?.subtotal || (invoice?.amount ? Math.round((invoice.amount / 1.18) * 100) / 100 : Math.round((transaction.amount / 1.18) * 100) / 100);
        const taxGst = invoice?.tax?.gst || (invoice?.amount ? Math.round((invoice.amount - subtotal) * 100) / 100 : Math.round((transaction.amount - subtotal) * 100) / 100);
        const sacCode = invoice?.sacCode || '998599';
        const gstin = invoice?.gstin || '29AAAAA0000A1Z5';

        const html = renderInvoiceHtml({
            invoiceNumber,
            date,
            orderId,
            planName,
            planType,
            subtotal,
            taxGst,
            totalAmount: transaction.amount,
            currency: transaction.currency || 'INR',
            gstin,
            sacCode,
            user: {
                name: user.name,
                email: user.email,
                mobile: user.mobile,
            }
        });

        if (req.query.download === 'true' || req.query.download === '1') {
            res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoiceNumber}.html"`);
        }
        res.setHeader('X-Esparex-Response-Mode', 'html-printable');
        res.setHeader('Content-Type', 'text/html');
        res.send(html);

    } catch (error: unknown) {
        const err = error as Error;
        logger.error('Get Invoice Error:', err);
        sendErrorResponse(req, res, 500, 'Failed to generate invoice');
    }
};

/**
 * 5. GET PLANS & WALLET DASHBOARD AGGREGATION
 * Fetches aggregated PlansWalletV1DTO snapshot for the authenticated user.
 */
export const getPlansWalletDashboard = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return sendErrorResponse(req, res, 401, 'Unauthorized');
        }

        const userId = req.user.id || req.user._id;
        if (!userId) {
            return sendErrorResponse(req, res, 401, 'User ID is required');
        }

        const snapshot = await DashboardFacade.getDashboardSnapshot(userId.toString());

        res.json(respond<ApiResponse<unknown>>({
            success: true,
            data: snapshot,
        }));
    } catch (error: unknown) {
        const err = error as Error;
        logger.error('Get Plans Wallet Dashboard Error:', err);
        sendErrorResponse(req, res, 500, 'Failed to fetch plans and wallet dashboard snapshot');
    }
};
