"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrintableInvoice = exports.updateInvoiceStatus = exports.createInvoice = exports.getInvoiceById = exports.getAllInvoices = void 0;
const crypto_1 = require("crypto");
const logger_1 = __importDefault(require("@esparex/core/utils/logger"));
const adminLogger_1 = require("@esparex/core/utils/adminLogger");
const paymentStatus_1 = require("@shared/enums/paymentStatus");
const invoiceNumber_1 = require("@esparex/core/utils/invoiceNumber");
const planEntitlements_1 = require("@shared/utils/planEntitlements");
const invoiceService = __importStar(require("@esparex/core/services/InvoiceService"));
const TransactionService_1 = require("@esparex/core/services/TransactionService");
const PlanService_1 = require("@esparex/core/services/PlanService");
const UserService_1 = require("@esparex/core/services/UserService");
const adminBaseController_1 = require("@esparex/core/utils/adminBaseController");
/**
 * Get all invoices with pagination and filtering
 */
const getAllInvoices = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { status, q } = req.query;
        const { items, total } = await invoiceService.getInvoices({
            search: typeof q === 'string' ? q : undefined,
            status: typeof status === 'string' ? status : undefined,
        }, { skip, limit });
        return (0, adminBaseController_1.sendPaginatedResponse)(res, items, total, page, limit);
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getAllInvoices = getAllInvoices;
/**
 * Get Invoice By ID
 */
const getInvoiceById = async (req, res) => {
    try {
        const invoiceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!invoiceId) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Invoice not found', 404);
        }
        const invoice = await invoiceService.getInvoiceById(invoiceId);
        if (!invoice) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Invoice not found', 404);
        }
        return (0, adminBaseController_1.sendSuccessResponse)(res, invoice);
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getInvoiceById = getInvoiceById;
/**
 * Create Invoice (Admin Manual)
 */
/**
 * Create Invoice (Admin Manual)
 */
const createInvoice = async (req, res) => {
    try {
        const { customerEmail, planId, amount, currency = 'INR', items, isGstInvoice } = req.body;
        if (!customerEmail) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Customer Email is required.', 400);
        }
        // 1. Find User
        const user = await (0, UserService_1.findUserByEmail)(customerEmail);
        if (!user) {
            // Option: Create a partial user? For now, strict: User must exist.
            return (0, adminBaseController_1.sendAdminError)(req, res, 'User not found with this email.', 404);
        }
        let transactionAmount = 0;
        let planSnapshot = null;
        let transactionDescription = "Invoice Payment";
        let resolvedPlanId;
        // CASE A: Subscription Plan Invoice (Legacy/Strict)
        if (planId) {
            const plan = await (0, PlanService_1.findPlanByIdOrCode)(planId);
            if (!plan) {
                return (0, adminBaseController_1.sendAdminError)(req, res, 'Plan not found.', 404);
            }
            const snapshotPrice = parseFloat(String(amount)) || plan.price;
            resolvedPlanId = plan._id.toString();
            planSnapshot = {
                code: plan.code,
                name: plan.name,
                type: plan.type,
                credits: (0, planEntitlements_1.getPrimaryPlanCreditCount)(plan),
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
            const itemsScale = items;
            const subTotal = itemsScale.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
            // Tax Calculation Logic
            // If isGstInvoice is true, we add 18% on top of subTotal? 
            // OR is subTotal inclusive? Usually exclusive for B2B.
            // Let's assume params passed subTotal, and tax is calculated.
            const gstRate = isGstInvoice ? 0.18 : 0;
            const taxAmount = subTotal * gstRate;
            transactionAmount = subTotal + taxAmount;
            transactionDescription = itemsScale.map(i => i.description).join(', ').substring(0, 100);
            if (itemsScale.length > 1)
                transactionDescription += '...';
        }
        else {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Either Plan ID or Items are required.', 400);
        }
        // 3. Create Transaction (Record the movement of money)
        // Admin can specify if this is a PENDING invoice (to be paid) or SUCCESS (already paid)
        // Default to PENDING for invoices that need payment, or SUCCESS for recording completed payments
        const requestedStatus = req.body.status;
        const validInvoiceStatuses = [paymentStatus_1.PAYMENT_STATUS.PENDING, paymentStatus_1.PAYMENT_STATUS.SUCCESS, paymentStatus_1.PAYMENT_STATUS.FAILED, paymentStatus_1.PAYMENT_STATUS.CANCELLED];
        const invoiceStatus = (typeof requestedStatus === 'string' &&
            validInvoiceStatuses.includes(requestedStatus))
            ? requestedStatus
            : paymentStatus_1.PAYMENT_STATUS.PENDING;
        const transactionStatus = invoiceStatus === paymentStatus_1.PAYMENT_STATUS.SUCCESS ? paymentStatus_1.PAYMENT_STATUS.SUCCESS : paymentStatus_1.PAYMENT_STATUS.INITIATED;
        const transaction = await (0, TransactionService_1.createPaymentTransaction)({
            userId: user._id,
            planId: resolvedPlanId,
            planSnapshot: planSnapshot || undefined,
            description: transactionDescription,
            amount: transactionAmount,
            currency: currency,
            status: transactionStatus,
            paymentGateway: 'MANUAL',
            gatewayOrderId: `MANUAL-${Date.now()}-${(0, crypto_1.randomInt)(100, 1000)}`,
            gatewayPaymentId: invoiceStatus === paymentStatus_1.PAYMENT_STATUS.SUCCESS ? `PAY-${Date.now()}` : undefined,
            applied: invoiceStatus === paymentStatus_1.PAYMENT_STATUS.SUCCESS // Only apply credits if payment is complete
        });
        // 4. Create Invoice
        const invoiceNumber = await (0, invoiceNumber_1.generateInvoiceNumber)();
        // Re-calculate specific tax structure for Invoice
        // Actually, let's use the explicit items math if available
        const taxBreakdown = { gst: 0, total: 0 };
        if (items && items.length > 0) {
            const itemsScale = items;
            const subTotal = itemsScale.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
            if (isGstInvoice) {
                taxBreakdown.gst = subTotal * 0.18;
                taxBreakdown.total = subTotal + taxBreakdown.gst;
                // Ensure transactionAmount matches roughly
            }
            else {
                taxBreakdown.total = subTotal;
            }
        }
        else {
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
        await (0, adminLogger_1.logAdminAction)(req, 'CREATE_INVOICE', 'Invoice', invoice._id.toString(), {
            invoiceNumber,
            customer: customerEmail,
            amount: transaction.amount
        });
        return (0, adminBaseController_1.sendSuccessResponse)(res, invoice, 'Invoice created successfully');
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.createInvoice = createInvoice;
/**
 * Update Invoice Status (Admin)
 * Transition PENDING -> SUCCESS, FAILED, or CANCELLED
 */
const updateInvoiceStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;
        const validStatuses = ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'];
        if (!status || !validStatuses.includes(status)) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Invalid status provided.', 400);
        }
        const invoice = await invoiceService.findInvoiceForUpdate(req.params.id);
        if (!invoice) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Invoice not found.', 404);
        }
        if (invoice.status === status) {
            return (0, adminBaseController_1.sendSuccessResponse)(res, invoice, 'Status is already set to ' + status);
        }
        const oldStatus = invoice.status;
        invoice.status = status;
        await invoiceService.saveInvoice(invoice);
        // If transitioning to SUCCESS, we MUST update the linked transaction and potentially apply the plan
        if (status === paymentStatus_1.PAYMENT_STATUS.SUCCESS && oldStatus !== paymentStatus_1.PAYMENT_STATUS.SUCCESS) {
            const transaction = await (0, TransactionService_1.findTransactionForUpdate)(invoice.transactionId?.toString() || '');
            if (transaction) {
                transaction.status = paymentStatus_1.PAYMENT_STATUS.SUCCESS;
                transaction.gatewayPaymentId = `MANUAL-ADMIN-${Date.now()}`;
                // If it was a plan purchase, apply it
                if (!transaction.applied) {
                    const user = await (0, TransactionService_1.getUserForPayment)(invoice.userId?.toString() || '');
                    const planSnapshot = invoice.planSnapshot;
                    if (user && planSnapshot) {
                        const startDate = new Date();
                        const snapshotDurationRaw = (planSnapshot).durationDays;
                        const durationDays = typeof snapshotDurationRaw === 'number' ? snapshotDurationRaw : 30;
                        const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
                        await (0, PlanService_1.upsertUserPlan)(user._id, transaction.planId, startDate, endDate);
                        transaction.applied = true;
                        logger_1.default.info('Plan applied to user via manual invoice success', { userId: user._id, invoiceId: invoice._id });
                    }
                }
                await (0, TransactionService_1.saveTransaction)(transaction);
            }
        }
        await (0, adminLogger_1.logAdminAction)(req, 'UPDATE_INVOICE_STATUS', 'Invoice', invoice._id.toString(), {
            invoiceNumber: invoice.invoiceNumber,
            from: oldStatus,
            to: status,
            notes
        });
        return (0, adminBaseController_1.sendSuccessResponse)(res, invoice, `Invoice status updated to ${status}`);
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.updateInvoiceStatus = updateInvoiceStatus;
/**
 * Get Printable Invoice (HTML version for browser printing)
 */
const getPrintableInvoice = async (req, res) => {
    try {
        const invoiceDoc = await invoiceService.getInvoiceById(req.params.id);
        if (!invoiceDoc) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Invoice not found', 404);
        }
        const inv = invoiceDoc;
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
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getPrintableInvoice = getPrintableInvoice;
//# sourceMappingURL=adminInvoiceController.js.map