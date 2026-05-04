/**
 * FINANCE ROUTES
 * Domain: Transactions, Finance Stats, Invoices, Smart Alerts
 */
import { Router } from 'express';
import { validateObjectId } from '../../middleware/validateObjectId';
import { searchLimiter, adminMutationLimiter } from '../../middleware/rateLimiter';
import { requirePermission } from '../../middleware/adminAuth';
import { validateRequest } from '../../middleware/validateRequest';
import * as transactionController from '@esparex/core/controllers/admin/adminTransactionController';
import * as adminInvoiceController from '@esparex/core/controllers/admin/adminInvoiceController';
import * as adminSmartAlertsController from '@esparex/core/controllers/admin/adminSmartAlertsController';
import {
    adminCreateInvoiceSchema,
    adminInvoiceQuerySchema,
    adminTransactionQuerySchema,
    adminUpdateInvoiceStatusSchema,
} from '@esparex/core/validators/finance.validator';

const router = Router();

// ============================================
// FINANCE & PAYMENTS
// ============================================
// ✅ STATIC
router.get('/finance/stats', requirePermission('finance:read'), searchLimiter, transactionController.getTransactionStats);

// ✅ FILTER / QUERY
router.get('/finance/transactions', requirePermission('finance:read'), searchLimiter, validateRequest({ query: adminTransactionQuerySchema }), transactionController.getAllTransactions);

// ============================================
// INVOICES
// ============================================
// ✅ STATIC / ACTION
router.get('/invoices/:id/print', requirePermission('finance:read'), validateObjectId, adminInvoiceController.getPrintableInvoice);

// ✅ FILTER / QUERY
router.get('/invoices', requirePermission('finance:read'), searchLimiter, validateRequest({ query: adminInvoiceQuerySchema }), adminInvoiceController.getAllInvoices);

// ✅ PARAM LAST
router.get('/invoices/:id', requirePermission('finance:read'), validateObjectId, adminInvoiceController.getInvoiceById);
router.post('/invoices', requirePermission('finance:manage'), adminMutationLimiter, validateRequest(adminCreateInvoiceSchema), adminInvoiceController.createInvoice);
router.patch('/invoices/:id/status', requirePermission('finance:manage'), adminMutationLimiter, validateObjectId, validateRequest(adminUpdateInvoiceStatusSchema), adminInvoiceController.updateInvoiceStatus);

// ============================================
// SMART ALERTS (admin-scoped — no user-context filtering)
// ============================================
router.get('/smart-alerts/logs', requirePermission('content:read'), adminSmartAlertsController.getSmartAlertLogs);
// FIXED (was using user-context smartAlertController which scoped by req.user._id — wrong in admin context)
router.get('/smart-alerts', requirePermission('content:read'), searchLimiter, adminSmartAlertsController.getAllSmartAlerts);
router.delete('/smart-alerts/:id', requirePermission('content:write'), adminMutationLimiter, validateObjectId, adminSmartAlertsController.deleteSmartAlertById);

export default router;
