import express from 'express';

import { requireAdmin } from '../middleware/adminAuth';
import { setCsrfToken, getCsrfToken } from '../middleware/csrfProtection';

import * as adminSystem from '@esparex/core/controllers/admin/system';
import * as adminAnalytics from '@esparex/core/controllers/admin/adminAnalyticsController';
import * as adminAudit from '@esparex/core/controllers/admin/adminAuditController';
import * as adminUsers from '@esparex/core/controllers/admin/adminUsersController';
import * as adminSessions from '@esparex/core/controllers/admin/adminSessionController';
import * as adminPlans from '@esparex/core/controllers/admin/plan';
import * as adminBusiness from '@esparex/core/controllers/admin/adminBusinessController';
import * as adminListings from '@esparex/core/controllers/admin/adminListingsController';
import * as adminReports from '@esparex/core/controllers/admin/adminReportsController';
import * as adminCatalog from '@esparex/core/controllers/admin/catalog';
import * as adminTransactions from '@esparex/core/controllers/admin/adminTransactionController';
import * as adminInvoices from '@esparex/core/controllers/admin/adminInvoiceController';
import * as adminNotifications from '@esparex/core/controllers/admin/adminNotificationController';
import * as adminAi from '@esparex/core/controllers/admin/ai/aiController';
import * as adminApiKeys from '@esparex/core/controllers/admin/adminApiKeyController';
import * as adminLocations from '@esparex/core/controllers/admin/adminLocationController';
import * as adminSystemConfig from '@esparex/core/controllers/admin/systemConfigController';
import * as adminImportContent from '@esparex/core/controllers/admin/content/import.content.controller';
import * as adminSmartAlerts from '@esparex/core/controllers/admin/adminSmartAlertsController';

const router = express.Router();

// Public admin auth surface
router.get('/csrf-token', setCsrfToken, getCsrfToken);
router.post('/auth/login', adminSystem.adminLogin);
router.post('/forgot-password', adminSystem.forgotPassword);
router.post('/reset-password/:token', adminSystem.resetPassword);

// Protected admin surface
router.use(requireAdmin);

router.post('/auth/logout', adminSystem.adminLogout);
router.get('/me', adminSystem.getMe);

// Dashboard and analytics
router.get('/stats', adminSystem.getStats);
router.get('/dashboard/stats', adminSystem.getDashboardStats);
router.get('/analytics', adminSystem.getAnalytics);
router.get('/analytics/revenue/summary', adminAnalytics.getRevenueSummary);
router.get('/analytics/revenue/categories', adminAnalytics.getRevenueByCategory);
router.get('/activity', adminSystem.getRecentActivity);
router.get('/security/audit', adminAudit.getAuditLogs);

// Users and sessions
router.get('/users', adminUsers.getUsers);
router.get('/users/:id', adminUsers.getUserById);
router.patch('/users/:id/status', adminUsers.updateUserStatus);
router.patch('/users/:id/verify', adminUsers.verifyUser);
router.get('/user-management/overview', adminUsers.getUserManagementOverview);

router.get('/admin-users', adminUsers.getAdmins);
router.post('/admin-users', adminUsers.createAdmin);
router.get('/admin-users/:id', adminUsers.getAdminById);
router.patch('/admin-users/:id', adminUsers.updateAdmin);
router.delete('/admin-users/:id', adminUsers.deleteAdmin);
router.patch('/admin-users/:id/deactivate', adminUsers.deactivateAdmin);

router.get('/admin-sessions', adminSessions.getAdminSessions);
router.post('/admin-sessions/:id/revoke', adminSessions.revokeAdminSessionById);

// Plans
router.get('/plans', adminPlans.getPlans);
router.post('/plans', adminPlans.createPlan);
router.get('/plans/:id', adminPlans.getPlans);
router.patch('/plans/:id', adminPlans.updatePlan);
router.patch('/plans/:id/toggle', adminPlans.togglePlan);

// Businesses
router.get('/businesses/accounts', adminBusiness.getBusinessAccounts);
router.get('/businesses/overview', adminBusiness.getBusinessOverview);
router.get('/businesses/:id', adminBusiness.getBusinessAccountById);
router.patch('/businesses/:id/approve', adminBusiness.approveBusinessAccount);
router.patch('/businesses/:id/reject', adminBusiness.rejectBusinessAccount);
router.patch('/businesses/:id/status', adminBusiness.updateBusinessStatus);
router.patch('/businesses/:id', adminBusiness.updateBusinessByAdmin);
router.delete('/businesses/:id', adminBusiness.deleteBusinessAccount);

// Listings and reports
router.get('/listings', adminListings.adminListListings);
router.get('/listings/counts', adminListings.adminGetListingCounts);
router.get('/listings/:id', adminListings.adminGetListingById);
router.patch('/listings/:id/approve', adminListings.adminApproveListing);
router.patch('/listings/:id/reject', adminListings.adminRejectListing);
router.patch('/listings/:id/deactivate', adminListings.adminDeactivateListing);
router.patch('/listings/:id/expire', adminListings.adminExpireListing);
router.patch('/listings/:id/extend', adminListings.adminExtendListing);
router.patch('/listings/:id/report-resolve', adminListings.adminResolveListingReport);
router.delete('/listings/:id', adminListings.adminSoftDeleteListing);

router.get('/reports', adminReports.getReportedAds);
router.get('/reports/:id', adminReports.getReportedAdById);
router.patch('/reports/:id/resolve', adminReports.resolveReport);
router.patch('/reports/:id/status', adminReports.updateReportStatus);

// Catalog
router.get('/categories', adminCatalog.getCategories);
router.get('/categories/counts', adminCatalog.getCategoryCounts);
router.get('/categories/:id', adminCatalog.getCategoryById);
router.get('/categories/:id/schema', adminCatalog.getCategorySchema);
router.patch('/categories/:id/status', adminCatalog.toggleCategoryStatus);

router.get('/governance/hierarchy-tree', adminCatalog.getHierarchyTree);

router.get('/brands', adminCatalog.getBrands);
router.get('/brands/:id', adminCatalog.getBrandById);
router.patch('/brands/:id/approve', adminCatalog.approveBrand);
router.patch('/brands/:id/reject', adminCatalog.rejectBrand);

router.get('/models', adminCatalog.getModels);
router.get('/models/:id', adminCatalog.getModelById);
router.post('/models/ensure', adminCatalog.ensureModel);
router.patch('/models/:id/approve', adminCatalog.approveModel);
router.patch('/models/:id/reject', adminCatalog.rejectModel);

router.get('/spare-parts', adminCatalog.getSpareParts);
router.get('/spare-parts/:id', adminCatalog.getSparePartById);

router.get('/service-types', adminCatalog.getServiceTypes);
router.get('/service-types/:id', adminCatalog.getServiceTypeById);
router.patch('/service-types/:id/toggle-status', adminCatalog.toggleServiceTypeStatus);

router.get('/screen-sizes', adminCatalog.getScreenSizes);
router.get('/screen-sizes/:id', adminCatalog.getScreenSizeById);

// Finance
router.get('/finance/transactions', adminTransactions.getAllTransactions);
router.get('/finance/stats', adminTransactions.getTransactionStats);
router.get('/invoices', adminInvoices.getAllInvoices);
router.post('/invoices', adminInvoices.createInvoice);
router.get('/invoices/:id', adminInvoices.getInvoiceById);
router.get('/invoices/:id/print', adminInvoices.getPrintableInvoice);

// Notifications, AI, API keys
router.post('/notifications/send', adminNotifications.sendNotification);
router.get('/notifications/history', adminNotifications.getHistory);
router.get('/notifications/recipients', adminNotifications.getRecipients);

router.post('/ai/generate', adminAi.generate);

router.get('/api-keys', adminApiKeys.getApiKeys);
router.post('/api-keys', adminApiKeys.createApiKey);
router.patch('/api-keys/:id/revoke', adminApiKeys.revokeApiKey);

// Locations and geofences
router.get('/locations', adminLocations.getAllLocations);
router.get('/locations/analytics', adminSystem.getLocationAnalytics);
router.get('/locations/states', adminLocations.getDistinctStates);
router.get('/locations/:id', adminLocations.getAllLocations);
router.patch('/locations/:id/toggle', adminLocations.toggleLocationStatus);

router.get('/geofences', adminLocations.getGeofences);
router.post('/geofences', adminLocations.createGeofence);
router.get('/geofences/:id', adminLocations.getGeofences);
router.patch('/geofences/:id', adminLocations.updateGeofence);
router.delete('/geofences/:id', adminLocations.deleteGeofence);

// System
router.get('/system/health', adminSystem.getSystemHealth);
router.get('/system/scan', adminSystem.runSystemScan);
router.post('/system/fix', adminSystem.applySystemFix);
router.get('/cache/health', adminSystem.getCacheHealth);

router.get('/system/config', adminSystemConfig.getSystemConfig);
router.patch('/system/config', adminSystemConfig.updateSystemConfig);

router.get('/support/contact', adminSystem.getContactSubmissions);
router.patch('/support/contact/:id/status', adminSystem.updateContactSubmissionStatus);

// Admin operations
router.post('/import/bulk', adminImportContent.bulkImport);
router.post('/import/seed-devices', adminImportContent.seedDevices);

router.get('/smart-alerts', adminSmartAlerts.getAllSmartAlerts);
router.get('/smart-alerts/logs', adminSmartAlerts.getSmartAlertLogs);
router.delete('/smart-alerts/:id', adminSmartAlerts.deleteSmartAlertById);

export default router;
