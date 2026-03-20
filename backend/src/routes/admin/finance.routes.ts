/**
 * FINANCE ROUTES
 * Domain: Transactions, Finance Stats, Invoices, Smart Alerts
 */
import { Router } from 'express';
import { validateObjectId } from '../../middleware/validateObjectId';
import { searchLimiter, adminMutationLimiter } from '../../middleware/rateLimiter';
import { requirePermission } from '../../middleware/adminAuth';
import * as transactionController from '../../controllers/admin/adminTransactionController';
import * as adminInvoiceController from '../../controllers/admin/adminInvoiceController';
import * as smartAlertController from '../../controllers/smartAlert';

const router = Router();

// ============================================
// FINANCE & PAYMENTS
// ============================================
// ✅ STATIC
router.get('/finance/stats', requirePermission('finance:read'), searchLimiter, transactionController.getTransactionStats);

// ✅ FILTER / QUERY
router.get('/finance/transactions', requirePermission('finance:read'), transactionController.getAllTransactions);

// ============================================
// INVOICES
// ============================================
// ✅ STATIC / ACTION
router.get('/invoices/:id/print', validateObjectId, adminInvoiceController.getPrintableInvoice);

// ✅ FILTER / QUERY
router.get('/invoices', adminInvoiceController.getAllInvoices);

// ✅ PARAM LAST
router.get('/invoices/:id', validateObjectId, adminInvoiceController.getInvoiceById);
router.post('/invoices', adminMutationLimiter, adminInvoiceController.createInvoice);
router.patch('/invoices/:id/status', adminMutationLimiter, validateObjectId, adminInvoiceController.updateInvoiceStatus);

// ============================================
// SMART ALERTS
// ============================================
router.get('/smart-alerts', requirePermission('content:read'), smartAlertController.getSmartAlerts);
router.delete('/smart-alerts/:id', requirePermission('content:write'), validateObjectId, smartAlertController.deleteSmartAlert);

export default router;
