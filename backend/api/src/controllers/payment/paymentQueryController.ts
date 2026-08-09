import fs from 'fs';
import path from 'path';
import logger from '@esparex/core/utils/logger';
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { respond } from "../../utils/respond";
import { ApiResponse, Role } from "@esparex/contracts";
import { normalizeRole } from '@esparex/core/utils/roleNormalization';
import { sendErrorResponse } from "../../utils/errorResponse";
import { InvoiceUser } from '@esparex/core/config/razorpay';
import { getUserTransactions, getTransactionWithUser } from '@esparex/core/domains/payments/application/TransactionService';
import { getActivePlans } from '@esparex/core/domains/payments/application/PlanService';
import { getInvoiceByIdOrTransaction } from '@esparex/core/domains/payments/application/InvoiceService';
import { DashboardFacade } from '@esparex/core/domains/payments/application/DashboardFacade';

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

        if (!Types.ObjectId.isValid(id)) {
            return sendErrorResponse(req, res, 400, 'Invalid ID Format', {
                details: { message: `Parameter 'id' must be a valid ObjectId` }
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
                return res.redirect(invoice.pdfUrl);
            }
        }

        const transactionId = invoice?.transactionId?.toString?.() ?? String(invoice?.transactionId ?? id);
        const transaction = await getTransactionWithUser(transactionId);

        if (!transaction) {
            return sendErrorResponse(req, res, 404, 'Invoice not found');
        }

        const user = transaction.userId as unknown as InvoiceUser;
        const reqUserRole = normalizeRole(req.user?.role);
        const isReqUserAdmin = reqUserRole === Role.ADMIN || reqUserRole === Role.SUPER_ADMIN;

        if (user._id.toString() !== req.user._id.toString() && !isReqUserAdmin) {
            return sendErrorResponse(req, res, 403, 'Unauthorized');
        }

        const date = new Date(transaction.createdAt).toLocaleDateString('en-IN', {
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

        let logoSrc = '';
        try {
            const logoPaths = [
                path.resolve(__dirname, '../../../../apps/web/public/icons/logo.png'),
                path.resolve(__dirname, '../../../../logo/Logo_esparex.png'),
                path.resolve(process.cwd(), 'apps/web/public/icons/logo.png'),
                path.resolve(process.cwd(), 'logo/Logo_esparex.png'),
            ];
            for (const lp of logoPaths) {
                if (fs.existsSync(lp)) {
                    const buf = fs.readFileSync(lp);
                    logoSrc = `data:image/png;base64,${buf.toString('base64')}`;
                    break;
                }
            }
        } catch {
            // fallback
        }

        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Tax Invoice - ${invoiceNumber} | Esparex</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    background-color: #f8fafc;
                    color: #0f172a;
                    line-height: 1.5;
                    padding: 30px 15px;
                }
                .invoice-card {
                    max-width: 800px;
                    margin: 0 auto;
                    background: #ffffff;
                    border-radius: 16px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                }
                .invoice-header {
                    padding: 32px 36px;
                    background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .brand-container {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .brand-logo {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    text-decoration: none;
                }
                .brand-text {
                    font-size: 24px;
                    font-weight: 900;
                    color: #0f172a;
                    letter-spacing: -0.5px;
                }
                .brand-text span { color: #10b981; }
                .brand-tagline {
                    font-size: 11px;
                    color: #64748b;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .invoice-title-block {
                    text-align: right;
                }
                .invoice-title {
                    font-size: 20px;
                    font-weight: 800;
                    color: #0f172a;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }
                .invoice-num {
                    font-size: 13px;
                    font-weight: 700;
                    color: #10b981;
                    margin-top: 2px;
                }
                .status-badge {
                    display: inline-block;
                    margin-top: 6px;
                    padding: 4px 10px;
                    border-radius: 9999px;
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    background: #dcfce7;
                    color: #15803d;
                    border: 1px solid #bbf7d0;
                }
                .invoice-body {
                    padding: 36px;
                }
                .grid-meta {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                    margin-bottom: 36px;
                    padding: 20px;
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 1px solid #f1f5f9;
                }
                .meta-col h3 {
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: #64748b;
                    letter-spacing: 0.5px;
                    margin-bottom: 8px;
                }
                .meta-col p {
                    font-size: 13px;
                    color: #334155;
                    margin-bottom: 3px;
                }
                .meta-col strong {
                    color: #0f172a;
                    font-weight: 700;
                }
                table.invoice-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 28px;
                }
                table.invoice-table th {
                    background: #f1f5f9;
                    color: #475569;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    padding: 12px 16px;
                    text-align: left;
                    border-bottom: 1px solid #cbd5e1;
                }
                table.invoice-table td {
                    padding: 16px;
                    font-size: 13px;
                    color: #334155;
                    border-bottom: 1px solid #f1f5f9;
                }
                .text-right { text-align: right; }
                .summary-container {
                    display: flex;
                    justify-content: flex-end;
                    margin-bottom: 36px;
                }
                .summary-table {
                    width: 300px;
                    border-collapse: collapse;
                }
                .summary-table td {
                    padding: 8px 12px;
                    font-size: 13px;
                    color: #475569;
                }
                .summary-table tr.total-row td {
                    border-top: 2px solid #0f172a;
                    font-size: 16px;
                    font-weight: 900;
                    color: #0f172a;
                    padding-top: 12px;
                }
                .invoice-footer {
                    padding: 24px 36px;
                    background: #f8fafc;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 12px;
                    color: #64748b;
                }
                .print-actions {
                    text-align: center;
                    margin-top: 24px;
                }
                .btn-print {
                    background: #10b981;
                    color: #ffffff;
                    border: none;
                    padding: 10px 24px;
                    font-size: 13px;
                    font-weight: 700;
                    border-radius: 8px;
                    cursor: pointer;
                    box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
                    transition: background 0.2s;
                }
                .btn-print:hover { background: #059669; }
                @media print {
                    body { background: #ffffff; padding: 0; }
                    .invoice-card { border: none; box-shadow: none; border-radius: 0; }
                    .print-actions { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="invoice-card">
                <div class="invoice-header">
                    <div class="brand-container">
                        <div class="brand-logo">
                            ${logoSrc ? `<img src="${logoSrc}" alt="Esparex" style="height: 38px; width: auto; max-width: 180px; object-fit: contain;" />` : `
                            <svg width="34" height="34" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="40" height="40" rx="10" fill="#10B981"/>
                                <path d="M12 28L20 12L28 28" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M15 22H25" stroke="white" stroke-width="3.5" stroke-linecap="round"/>
                            </svg>
                            <span class="brand-text">espare<span>X</span></span>
                            `}
                        </div>
                        <div class="brand-tagline">India's Tech Repair & Spare Parts Marketplace</div>
                    </div>
                    <div class="invoice-title-block">
                        <div class="invoice-title">Tax Invoice</div>
                        <div class="invoice-num">${invoiceNumber}</div>
                        <div class="status-badge">PAID</div>
                    </div>
                </div>

                <div class="invoice-body">
                    <div class="grid-meta">
                        <div class="meta-col">
                            <h3>Billed From (Seller)</h3>
                            <p><strong>Esparex Technologies Pvt. Ltd.</strong></p>
                            <p>123 Tech Park, Sector 5</p>
                            <p>Bangalore, Karnataka 560100</p>
                            <p><strong>GSTIN:</strong> ${gstin}</p>
                            <p><strong>SAC Code:</strong> ${sacCode}</p>
                            <p>support@esparex.com</p>
                        </div>
                        <div class="meta-col">
                            <h3>Billed To (Customer)</h3>
                            <p><strong>${user.name || 'Valued Customer'}</strong></p>
                            <p>${user.email}</p>
                            <p>${user.mobile || '-'}</p>
                            <p><strong>Invoice Date:</strong> ${date}</p>
                            <p><strong>Payment Order:</strong> ${orderId}</p>
                        </div>
                    </div>

                    <table class="invoice-table">
                        <thead>
                            <tr>
                                <th>Item Description</th>
                                <th>Category / Type</th>
                                <th>SAC Code</th>
                                <th class="text-right">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <strong>${planName}</strong><br>
                                    <span style="font-size: 11px; color: #64748b;">Order Ref: ${orderId}</span>
                                </td>
                                <td>${planType}</td>
                                <td>${sacCode}</td>
                                <td class="text-right">₹${subtotal.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="summary-container">
                        <table class="summary-table">
                            <tr>
                                <td>Subtotal (Base Price):</td>
                                <td class="text-right">₹${subtotal.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>GST (18% Applicable):</td>
                                <td class="text-right">₹${taxGst.toFixed(2)}</td>
                            </tr>
                            <tr class="total-row">
                                <td>Total Amount Paid:</td>
                                <td class="text-right">₹${(transaction.amount / 1).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </table>
                    </div>
                </div>

                <div class="invoice-footer">
                    <div>
                        <strong>Verification:</strong> Verified Electronic Tax Invoice
                    </div>
                    <div>
                        Computer-generated invoice. No physical signature required.
                    </div>
                </div>
            </div>

            <div class="print-actions">
                <button onclick="window.print()" class="btn-print">🖨️ Print Invoice</button>
            </div>
        </body>
        </html>
        `;

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
