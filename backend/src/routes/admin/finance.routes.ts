/**
 * FINANCE ROUTES
 * Domain: Transactions, Finance Stats, Invoices, Smart Alerts
 */
import { Router } from 'express';
import { validateObjectId } from '../../middleware/validateObjectId';
import { searchLimiter, adminMutationLimiter } from '../../middleware/rateLimiter';
import { requirePermission } from '../../middleware/adminAuth';
import { validateRequest } from '../../middleware/validateRequest';
import * as transactionController from '../../controllers/admin/adminTransactionController';
import * as adminInvoiceController from '../../controllers/admin/adminInvoiceController';
import * as adminSmartAlertsController from '../../controllers/admin/adminSmartAlertsController';
import * as smartAlertController from '../../controllers/smartAlert';
import {
    adminCreateInvoiceSchema,
    adminInvoiceQuerySchema,
    adminTransactionQuerySchema,
    adminUpdateInvoiceStatusSchema,
} from '../../validators/finance.validator';

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
// SMART ALERTS
// ============================================
router.get('/smart-alerts/logs', requirePermission('content:read'), adminSmartAlertsController.getSmartAlertLogs);
router.get('/smart-alerts', requirePermission('content:read'), smartAlertController.getSmartAlerts);
router.delete('/smart-alerts/:id', requirePermission('content:write'), validateObjectId, smartAlertController.deleteSmartAlert);

export default router;
