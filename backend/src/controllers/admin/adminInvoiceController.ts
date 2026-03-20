import { Request, Response } from 'express';
import { randomInt } from 'crypto';
import Invoice from '../../models/Invoice';
import Transaction from '../../models/Transaction';
import Plan from '../../models/Plan';
import User from '../../models/User';
import UserPlan from '../../models/UserPlan';
import { logAdminAction } from '../../utils/adminLogger';
import { escapeRegExp } from '../../utils/stringUtils';
import logger from '../../utils/logger';
import { sendErrorResponse } from '../../utils/errorResponse';
import { generateInvoiceNumber } from '../../utils/invoiceNumber';
import { PAYMENT_STATUS } from '../../../../shared/enums/paymentStatus';
import { PLAN_STATUS } from '../../../../shared/enums/planStatus';

// Helper for safe JSON responses
const sendJson = (res: Response, status: number, data: unknown) => {
    return res.status(status).json(data);
};

import { respond } from '../../utils/respond';

/**
 * Get all invoices with pagination and filtering
 */
export const getAllInvoices = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const { status, search } = req.query;

        const query: Record<string, unknown> & { $or?: Array<Record<string, unknown>> } = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (search) {
            const safeSearch = escapeRegExp(search as string);
            query.$or = [
                { invoiceNumber: { $regex: safeSearch, $options: 'i' } },
                { "userId.name": { $regex: safeSearch, $options: 'i' } }, // Assuming we might want to search user name if feasible, but userId is ref.
                // Standard search on Invoice Number
            ];

            // To search by User Name, we'd need a lookup or knowing User ID. 
            // For now, let's stick to invoiceNumber or try to populate query if needed. 
            // Keeping it simple for safety.
        }

        const invoices = await Invoice.find(query)
            .populate('userId', 'name email mobile')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Invoice.countDocuments(query);

        return sendJson(res, 200, respond({
            success: true,
            data: {
                data: invoices,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        }));

    } catch (error: unknown) {
        logger.error('Error fetching admin invoices', {
            error: error instanceof Error ? error.message : String(error)
        });
        return sendErrorResponse(req, res, 500, 'Internal Server Error');
    }
};

/**
 * Get Invoice By ID
 */
export const getInvoiceById = async (req: Request, res: Response) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('userId', 'name email mobile');
        if (!invoice) {
            return sendErrorResponse(req, res, 404, 'Invoice not found');
        }
        return sendJson(res, 200, respond({
            success: true,
            data: invoice
        }));
    } catch {
        return sendErrorResponse(req, res, 500, 'Internal Server Error');
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
            return sendErrorResponse(req, res, 400, 'Customer Email is required.');
        }

        // 1. Find User
        const user = await User.findOne({ email: customerEmail });
        if (!user) {
            // Option: Create a partial user? For now, strict: User must exist.
            return sendErrorResponse(req, res, 404, 'User not found with this email.');
        }

        let transactionAmount = 0;
        let planSnapshot: Record<string, unknown> | null = null;
        let transactionDescription = "Invoice Payment";

        // CASE A: Subscription Plan Invoice (Legacy/Strict)
        if (planId) {
            let plan = await Plan.findById(planId);
            if (!plan) plan = await Plan.findOne({ code: planId });

            if (!plan) {
                return sendErrorResponse(req, res, 404, 'Plan not found.');
            }

            const snapshotPrice = parseFloat(amount) || plan.price;

            planSnapshot = {
                code: plan.code,
                name: plan.name,
                type: plan.type,
                credits: plan.credits,
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
            return sendErrorResponse(req, res, 400, 'Either Plan ID or Items are required.');
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
            planId: planId ? (planSnapshot ? null : planId) : undefined, // Ref if exists
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

        return sendJson(res, 201, respond({
            success: true,
            message: 'Invoice created successfully',
            data: invoice
        }));

    } catch (error: unknown) {
        logger.error('Error creating invoice', {
            error: error instanceof Error ? error.message : String(error)
        });
        return sendErrorResponse(
            req,
            res,
            500,
            error instanceof Error ? error.message : 'Internal Server Error'
        );
    }
};

/**
 * Update Invoice Status (Admin)
 * Transition PENDING -> SUCCESS, FAILED, or CANCELLED
 */
export const updateInvoiceStatus = async (req: Request, res: Response) => {
    try {
        const { status, notes } = req.body;
        const validStatuses = [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.FAILED, PAYMENT_STATUS.CANCELLED];

        if (!status || !validStatuses.includes(status)) {
            return sendErrorResponse(req, res, 400, 'Invalid status provided.');
        }

        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return sendErrorResponse(req, res, 404, 'Invoice not found.');
        }

        if (invoice.status === status) {
            return sendJson(res, 200, respond({
                success: true,
                message: 'Status is already set to ' + status,
                data: invoice
            }));
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

                        await UserPlan.create({
                            userId: user._id,
                            planId: transaction.planId, // Using planId from transaction if available
                            startDate,
                            endDate,
                            status: PLAN_STATUS.ACTIVE
                        });

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

        return sendJson(res, 200, respond({
            success: true,
            message: `Invoice status updated to ${status}`,
            data: invoice
        }));

    } catch (error: unknown) {
        logger.error('Error updating invoice status', {
            error: error instanceof Error ? error.message : String(error)
        });
        return sendErrorResponse(req, res, 500, 'Internal Server Error');
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
            return sendErrorResponse(req, res, 404, 'Invoice not found');
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
        logger.error('Error generating printable invoice', {
            error: error instanceof Error ? error.message : String(error)
        });
        return sendErrorResponse(req, res, 500, 'Internal Server Error');
    }
};
