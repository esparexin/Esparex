import { Request, Response } from 'express';
import { randomInt } from 'crypto';
import logger from '../../utils/logger';
import Invoice from '../../models/Invoice';
import Transaction from '../../models/Transaction';
import Plan from '../../models/Plan';
import User from '../../models/User';
import UserPlan from '../../models/UserPlan';
import { logAdminAction } from '../../utils/adminLogger';
import { respond } from '../../utils/respond';
import { PAYMENT_STATUS } from '../../../../shared/enums/paymentStatus';
import { PLAN_STATUS } from '@shared/enums/planStatus';
import { generateInvoiceNumber } from '../../utils/invoiceNumber';
import { getPrimaryPlanCreditCount } from '@shared/utils/planEntitlements';
import * as invoiceService from '../../services/InvoiceService';
import { 
    sendSuccessResponse, 
    sendAdminError,
    sendPaginatedResponse 
} from './adminBaseController';

/**
 * Get all invoices with pagination and filtering
 */
export const getAllInvoices = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const { status, search } = req.query;

        const { items, total } = await invoiceService.getInvoices(
            {
                search: typeof search === 'string' ? search : undefined,
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
        const { customerEmail, planId, amount, currency = 'INR', items, isGstInvoice } = req.body;

        if (!customerEmail) {
            return sendAdminError(req, res, 'Customer Email is required.', 400);
        }

        // 1. Find User
        const user = await User.findOne({ email: customerEmail });
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
            let plan = await Plan.findById(planId);
            if (!plan) plan = await Plan.findOne({ code: planId });

            if (!plan) {
                return sendAdminError(req, res, 'Plan not found.', 404);
            }

            const snapshotPrice = parseFloat(amount) || plan.price;
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
        const requestedStatus = req.body.status;
        const validInvoiceStatuses = [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.FAILED, PAYMENT_STATUS.CANCELLED] as const;
        const invoiceStatus = (typeof requestedStatus === 'string' &&
            validInvoiceStatuses.includes(requestedStatus as (typeof validInvoiceStatuses)[number]))
            ? requestedStatus as (typeof validInvoiceStatuses)[number]
            : PAYMENT_STATUS.PENDING;
        const transactionStatus: typeof PAYMENT_STATUS.INITIATED | typeof PAYMENT_STATUS.SUCCESS = invoiceStatus === PAYMENT_STATUS.SUCCESS ? PAYMENT_STATUS.SUCCESS : PAYMENT_STATUS.INITIATED;

        const transaction = await Transaction.create({
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

        const invoice = await Invoice.create({
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
 * Update Invoice Status (Admin)
 * Transition PENDING -> SUCCESS, FAILED, or CANCELLED
 */
export const updateInvoiceStatus = async (req: Request, res: Response) => {
    try {
        const { status, notes } = req.body;
        const validStatuses = ['PENDING', 'SUCCESS' as any, 'FAILED' as any, 'CANCELLED' as any];

        if (!status || !validStatuses.includes(status)) {
            return sendAdminError(req, res, 'Invalid status provided.', 400);
        }

        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return sendAdminError(req, res, 'Invoice not found.', 404);
        }

        if (invoice.status === status) {
            return sendSuccessResponse(res, invoice, 'Status is already set to ' + status);
        }

        const oldStatus = invoice.status;
        invoice.status = status as typeof invoice.status;
        await invoice.save();

        // If transitioning to SUCCESS, we MUST update the linked transaction and potentially apply the plan
        if (status === PAYMENT_STATUS.SUCCESS && oldStatus !== PAYMENT_STATUS.SUCCESS) {
            const transaction = await Transaction.findById(invoice.transactionId);
            if (transaction) {
                transaction.status = PAYMENT_STATUS.SUCCESS;
                transaction.gatewayPaymentId = `MANUAL-ADMIN-${Date.now()}`;

                // If it was a plan purchase, apply it
                if (!transaction.applied) {
                    const user = await User.findById(invoice.userId);
                    const planSnapshot = invoice.planSnapshot;

                    if (user && planSnapshot) {
                        const startDate = new Date();
                        const snapshotDurationRaw = (planSnapshot as Record<string, unknown>).durationDays;
                        const durationDays = typeof snapshotDurationRaw === 'number' ? snapshotDurationRaw : 30;
                        const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

                        await UserPlan.findOneAndUpdate(
                            { userId: user._id, planId: transaction.planId },
                            { $set: { startDate, endDate, status: PLAN_STATUS.ACTIVE } },
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        );

                        transaction.applied = true;
                        logger.info('Plan applied to user via manual invoice success', { userId: user._id, invoiceId: invoice._id });
                    }
                }
                await transaction.save();
            }
        }

        await logAdminAction(req, 'UPDATE_INVOICE_STATUS', 'Invoice', invoice._id.toString(), {
            invoiceNumber: invoice.invoiceNumber,
            from: oldStatus,
            to: status,
            notes
        });

        return sendSuccessResponse(res, invoice, `Invoice status updated to ${status}`);

    } catch (error: unknown) {
        return sendAdminError(req, res, error);
    }
};

/**
 * Get Printable Invoice (HTML version for browser printing)
 */
export const getPrintableInvoice = async (req: Request, res: Response) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('userId', 'name email mobile address');

        if (!invoice) {
            return sendAdminError(req, res, 'Invoice not found', 404);
        }

        const inv = invoice.toObject() as unknown as Record<string, unknown> & {
            invoiceNumber: string;
            issuedAt: string | Date;
            userId?: { name?: string; email?: string; mobile?: string };
            planSnapshot?: { name?: string; type?: string; credits?: number; price?: number };
            currency: string;
            amount: number;
            tax?: { gst?: number };
        };

        // Simple HTML template for printing
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice - ${inv.invoiceNumber}</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; }
                    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
                    .company-info h1 { color: #f97316; margin: 0; }
                    .invoice-info { text-align: right; }
                    .bill-to { margin-bottom: 40px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
                    th { background: #f9fafb; }
                    .totals { float: right; width: 300px; }
                    .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
                    .grand-total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #eee; margin-top: 10px; padding-top: 10px; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="no-print" style="background: #fffbeb; padding: 10px; border: 1px solid #fde68a; margin-bottom: 20px;">
                    <button onclick="window.print()">Print to PDF</button>
                </div>
                <div class="header">
                    <div class="company-info">
                        <h1>ESPAREX</h1>
                        <p>Structural Data Platform</p>
                    </div>
                    <div class="invoice-info">
                        <h2>INVOICE</h2>
                        <p># ${inv.invoiceNumber}</p>
                        <p>Date: ${new Date(inv.issuedAt).toLocaleDateString()}</p>
                    </div>
                </div>
                <div class="bill-to">
                    <strong>BILL TO:</strong>
                    <p>${inv.userId?.name || 'Customer'}</p>
                    <p>${inv.userId?.email || ''}</p>
                    <p>${inv.userId?.mobile || ''}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Plan Type</th>
                            <th>Credits/Limit</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${inv.planSnapshot?.name || 'Subscription Plan'}</td>
                            <td>${inv.planSnapshot?.type || ''}</td>
                            <td>${inv.planSnapshot?.credits || 0} credits</td>
                            <td>${inv.currency} ${inv.planSnapshot?.price?.toFixed(2) || '0.00'}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="totals">
                    <div class="total-row">
                        <span>Subtotal</span>
                        <span>${inv.currency} ${(inv.amount - (inv.tax?.gst || 0)).toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                        <span>GST (18%)</span>
                        <span>${inv.currency} ${(inv.tax?.gst || 0).toFixed(2)}</span>
                    </div>
                    <div class="total-row grand-total">
                        <span>Total Due</span>
                        <span>${inv.currency} ${inv.amount.toFixed(2)}</span>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Explicit contract exemption: printable invoice endpoint intentionally returns HTML.
        res.set('X-Esparex-Response-Mode', 'html-printable');
        res.set('Content-Type', 'text/html');
        return res.send(html);

    } catch (error: unknown) {
        return sendAdminError(req, res, error);
    }
};
