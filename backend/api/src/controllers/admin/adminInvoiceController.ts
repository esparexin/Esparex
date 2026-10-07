import { Request, Response } from 'express';
import { randomInt } from 'crypto';
import { logAdminAction } from '../../utils/adminLogger';
import { PAYMENT_STATUS } from "@esparex/contracts";
import { generateInvoiceNumber } from '@esparex/core';
import { getPrimaryPlanCreditCount, formatAppDate } from "@esparex/shared";
import * as invoiceService from '@esparex/core/domains/payments';
import { renderInvoiceHtml } from '@esparex/core/domains/payments';
import {
    createPaymentTransaction,
} from '@esparex/core/domains/payments';
import { findPlanByIdOrCode } from '@esparex/core/domains/payments';
import { findUserByEmail } from '@esparex/core/domains/identity';
import { 
    sendSuccessResponse, 
    sendAdminError,
    sendPaginatedResponse 
} from '../../utils/adminBaseController';

/**
 * Get all invoices with pagination and filtering
 */
export const getAllInvoices = async (req: Request, res: Response) => {
    try {
        const page = Math.min(1000, Math.max(1, parseInt(req.query.page as string) || 1));
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
        const skip = (page - 1) * limit;

        const { status, q } = req.query;

        const { items, total } = await invoiceService.getInvoices(
            {
                search: typeof q === 'string' ? q : undefined,
                status: typeof status === 'string' ? status : undefined,
            },
            { skip, limit }
        );

        return sendPaginatedResponse(res, items, total, page, limit);

    } catch (error: unknown) {
        return sendAdminError(req, res, error);
    }
};

/**
 * Get Invoice By ID
 */
export const getInvoiceById = async (req: Request, res: Response) => {
    try {
        const invoiceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!invoiceId) {
            return sendAdminError(req, res, 'Invoice not found', 404);
        }

        const invoice = await invoiceService.getInvoiceById(invoiceId);
        if (!invoice) {
            return sendAdminError(req, res, 'Invoice not found', 404);
        }
        return sendSuccessResponse(res, invoice);
    } catch (error: unknown) {
        return sendAdminError(req, res, error);
    }
};

/**
 * Create Invoice (Admin Manual)
 */
/**
 * Create Invoice (Admin Manual)
 */
export const createInvoice = async (req: Request, res: Response) => {
    try {
        const { customerEmail, planId, amount, currency = 'INR', items, isGstInvoice } = req.body as {
            customerEmail?: string;
            planId?: string;
            amount?: number | string;
            currency?: string;
            items?: Array<{ unitPrice: number; quantity: number; description: string }>;
            isGstInvoice?: boolean;
        };

        if (!customerEmail) {
            return sendAdminError(req, res, 'Customer Email is required.', 400);
        }

        // 1. Find User
        const user = await findUserByEmail(customerEmail);
        if (!user) {
            // Option: Create a partial user? For now, strict: User must exist.
            return sendAdminError(req, res, 'User not found with this email.', 404);
        }

        let transactionAmount = 0;
        let planSnapshot: Record<string, unknown> | null = null;
        let transactionDescription = "Invoice Payment";
        let resolvedPlanId: string | undefined;

        // CASE A: Subscription Plan Invoice (Legacy/Strict)
        if (planId) {
            const plan = await findPlanByIdOrCode(planId);

            if (!plan) {
                return sendAdminError(req, res, 'Plan not found.', 404);
            }

            const snapshotPrice = parseFloat(String(amount)) || plan.price;

            resolvedPlanId = plan._id.toString();

            planSnapshot = {
                code: plan.code,
                name: plan.name,
                type: plan.type,
                credits: getPrimaryPlanCreditCount(plan),
                durationDays: plan.durationDays,
                limits: plan.limits,
                price: snapshotPrice,
                currency: currency || plan.currency,
            };
            transactionAmount = snapshotPrice;
            transactionDescription = `Subscription: ${plan.name}`;
        }
        // CASE B: Generic / Multi-Item Invoice
        else if (items && items.length > 0) {
            // Calculate total from items
            const itemsScale = items as Array<{ unitPrice: number, quantity: number, description: string }>;
            const subTotal = itemsScale.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);

            // Tax Calculation Logic
            // If isGstInvoice is true, we add 18% on top of subTotal? 
            // OR is subTotal inclusive? Usually exclusive for B2B.
            // Let's assume params passed subTotal, and tax is calculated.
            const gstRate = isGstInvoice ? 0.18 : 0;
            const taxAmount = subTotal * gstRate;
            transactionAmount = subTotal + taxAmount;

            transactionDescription = itemsScale.map(i => i.description).join(', ').substring(0, 100);
            if (itemsScale.length > 1) transactionDescription += '...';
        } else {
            return sendAdminError(req, res, 'Either Plan ID or Items are required.', 400);
        }

        // 3. Create Transaction (Record the movement of money)
        // Admin can specify if this is a PENDING invoice (to be paid) or SUCCESS (already paid)
        // Default to PENDING for invoices that need payment, or SUCCESS for recording completed payments
        const requestedStatus = (req.body as { status?: unknown }).status;
        const validInvoiceStatuses = [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.FAILED, PAYMENT_STATUS.CANCELLED] as const;
        const invoiceStatus = (typeof requestedStatus === 'string' &&
            validInvoiceStatuses.includes(requestedStatus as (typeof validInvoiceStatuses)[number]))
            ? requestedStatus as (typeof validInvoiceStatuses)[number]
            : PAYMENT_STATUS.PENDING;
        const transactionStatus: typeof PAYMENT_STATUS.INITIATED | typeof PAYMENT_STATUS.SUCCESS = invoiceStatus === PAYMENT_STATUS.SUCCESS ? PAYMENT_STATUS.SUCCESS : PAYMENT_STATUS.INITIATED;

        const transaction = await createPaymentTransaction({
            userId: user._id,
            planId: resolvedPlanId,
            planSnapshot: planSnapshot || undefined,
            description: transactionDescription,
            amount: transactionAmount,
            currency: currency,
            status: transactionStatus,
            paymentGateway: 'MANUAL',
            gatewayOrderId: `MANUAL-${Date.now()}-${randomInt(100, 1000)}`,
            gatewayPaymentId: invoiceStatus === PAYMENT_STATUS.SUCCESS ? `PAY-${Date.now()}` : undefined,
            applied: invoiceStatus === PAYMENT_STATUS.SUCCESS // Only apply credits if payment is complete
        });

        // 4. Create Invoice
        const invoiceNumber = await generateInvoiceNumber();

        // Re-calculate specific tax structure for Invoice
        // Actually, let's use the explicit items math if available
        const taxBreakdown = { gst: 0, total: 0 };
        if (items && items.length > 0) {
            const itemsScale = items as Array<{ unitPrice: number, quantity: number, description: string, total: number }>;
            const subTotal = itemsScale.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
            if (isGstInvoice) {
                taxBreakdown.gst = subTotal * 0.18;
                taxBreakdown.total = subTotal + taxBreakdown.gst;
                // Ensure transactionAmount matches roughly
            } else {
                taxBreakdown.total = subTotal;
            }
        } else {
            // Plan fallback
            taxBreakdown.gst = transactionAmount - (transactionAmount / 1.18); // Approx if inclusive? 
            // Actually plans are usually inclusive. Let's assume manual amount is final.
            taxBreakdown.total = transactionAmount;
        }

        const invoice = await invoiceService.createInvoiceRecord({
            invoiceNumber,
            userId: user._id,
            transactionId: transaction._id,
            planSnapshot: planSnapshot ?? undefined, // Optional now
            items: items, // Save line items
            isGstInvoice: !!isGstInvoice,
            billingAddress: {
                line1: user.name || user.email || 'Customer',
                country: 'India'
            },
            gstin: undefined,
            sacCode: '998599',
            subtotal: Math.max(0, taxBreakdown.total - taxBreakdown.gst),
            cgst: isGstInvoice ? taxBreakdown.gst / 2 : 0,
            sgst: isGstInvoice ? taxBreakdown.gst / 2 : 0,
            igst: 0,
            total: transactionAmount,
            amount: transactionAmount,
            currency: transaction.currency,
            status: invoiceStatus, // PENDING or SUCCESS based on payment status
            tax: taxBreakdown,
            issuedAt: new Date(),
        });

        await logAdminAction(req, 'CREATE_INVOICE', 'Invoice', invoice._id.toString(), {
            invoiceNumber,
            customer: customerEmail,
            amount: transaction.amount
        });

        return sendSuccessResponse(res, invoice, 'Invoice created successfully');

    } catch (error: unknown) {
        return sendAdminError(req, res, error);
    }
};


/**
 * Get Printable Invoice (HTML version for browser printing)
 */
export const getPrintableInvoice = async (req: Request, res: Response) => {
    try {
        const invoiceDoc = await invoiceService.getInvoiceById(req.params.id as string);
        if (!invoiceDoc) {
            return sendAdminError(req, res, 'Invoice not found', 404);
        }
        const rawInvoiceDoc: unknown = invoiceDoc;
        const inv = rawInvoiceDoc as Record<string, unknown> & {
            invoiceNumber: string;
            issuedAt: string | Date;
            userId?: { name?: string; email?: string; mobile?: string };
            planSnapshot?: { name?: string; type?: string; credits?: number; price?: number };
            currency: string;
            amount: number;
            tax?: { gst?: number };
        };

        const planName = inv.planSnapshot?.name || 'Subscription Plan';
        const planType = inv.planSnapshot?.type || 'Service';
        const taxGst = inv.tax?.gst || 0;
        const subtotal = inv.amount - taxGst;
        const date = formatAppDate(inv.issuedAt, {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        const html = renderInvoiceHtml({
            invoiceNumber: inv.invoiceNumber,
            date,
            orderId: String(inv.transactionId || inv.invoiceNumber),
            planName,
            planType,
            subtotal,
            taxGst,
            totalAmount: inv.amount,
            currency: inv.currency || 'INR',
            user: {
                name: inv.userId?.name,
                email: inv.userId?.email,
                mobile: inv.userId?.mobile,
            }
        });

        // Explicit contract exemption: printable invoice endpoint intentionally returns HTML.
        res.set('X-Esparex-Response-Mode', 'html-printable');
        res.set('Content-Type', 'text/html');
        return res.send(html);

    } catch (error: unknown) {
        return sendAdminError(req, res, error);
    }
};
