import express from 'express';

import { requireAdmin, requirePermission } from '../middleware/adminAuth';
import { setCsrfToken, getCsrfToken } from '../middleware/csrfProtection';

import * as adminSystem from '../controllers/admin/system';
import * as adminAnalytics from '../controllers/admin/adminAnalyticsController';
import * as adminAudit from '../controllers/admin/adminAuditController';
import * as adminUsers from '../controllers/admin/adminUsersController';
import * as adminSessions from '../controllers/admin/adminSessionController';
import * as adminPlans from '../controllers/admin/plan';
import * as adminBusiness from '../controllers/admin/adminBusinessController';
import * as adminListings from '../controllers/admin/adminListingsController';
import * as adminReports from '../controllers/admin/adminReportsController';
import * as adminTransactions from '../controllers/admin/adminTransactionController';
import * as adminInvoices from '../controllers/admin/adminInvoiceController';
import * as adminNotifications from '../controllers/admin/adminNotificationController';
import * as adminAi from '../controllers/ai/aiController';
import * as adminApiKeys from '../controllers/admin/adminApiKeyController';
import * as adminLocations from '../controllers/admin/adminLocationController';
import * as adminSystemConfig from '../controllers/admin/systemConfigController';
import * as adminImportContent from '../controllers/admin/content/import.content.controller';
import * as adminSmartAlerts from '../controllers/admin/adminSmartAlertsController';

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
router.get('/security/audit', requirePermission('system:logs'), adminAudit.getAuditLogs);

// Users and sessions
router.get('/users', requirePermission('users:read'), adminUsers.getUsers);
router.get('/users/:id', requirePermission('users:read'), adminUsers.getUserById);
router.patch('/users/:id/status', requirePermission('users:write'), adminUsers.updateUserStatus);
router.patch('/users/:id/verify', requirePermission('users:write'), adminUsers.verifyUser);
router.get('/user-management/overview', requirePermission('users:read'), adminUsers.getUserManagementOverview);

router.get('/admin-users', requirePermission('system:config'), adminUsers.getAdmins);
router.post('/admin-users', requirePermission('system:config'), adminUsers.createAdmin);
router.get('/admin-users/:id', requirePermission('system:config'), adminUsers.getAdminById);
router.patch('/admin-users/:id', requirePermission('system:config'), adminUsers.updateAdmin);
router.delete('/admin-users/:id', requirePermission('system:config'), adminUsers.deleteAdmin);
router.patch('/admin-users/:id/deactivate', requirePermission('system:config'), adminUsers.deactivateAdmin);

router.get('/admin-sessions', requirePermission('system:config'), adminSessions.getAdminSessions);
router.post('/admin-sessions/:id/revoke', requirePermission('system:config'), adminSessions.revokeAdminSessionById);

// Plans
router.get('/plans', adminPlans.getPlans);
router.post('/plans', requirePermission('system:config'), adminPlans.createPlan);
router.get('/plans/:id', adminPlans.getPlans);
router.patch('/plans/:id', requirePermission('system:config'), adminPlans.updatePlan);
router.patch('/plans/:id/toggle', requirePermission('system:config'), adminPlans.togglePlan);

// Businesses
router.get('/businesses/accounts', adminBusiness.getBusinessAccounts);
router.get('/businesses/overview', adminBusiness.getBusinessOverview);
router.get('/businesses/:id', adminBusiness.getBusinessAccountById);

router.patch('/businesses/:id/status', requirePermission('business:approve'), adminBusiness.updateBusinessStatus);
router.patch('/businesses/:id/renew', requirePermission('business:approve'), adminBusiness.renewBusinessAccount);
router.patch('/businesses/:id/expire', requirePermission('business:approve'), adminBusiness.expireBusinessAccount);
router.patch('/businesses/:id', requirePermission('business:approve'), adminBusiness.updateBusinessByAdmin);

router.delete('/businesses/:id', requirePermission('business:approve'), adminBusiness.deleteBusinessAccount);

// Bulk Operations
router.post('/businesses/bulk/approve', requirePermission('business:approve'), adminBusiness.adminBulkApproveBusinesses);
router.post('/businesses/bulk/reject', requirePermission('business:approve'), adminBusiness.adminBulkRejectBusinesses);
router.post('/businesses/bulk/deactivate', requirePermission('business:approve'), adminBusiness.adminBulkDeactivateBusinesses);
router.post('/businesses/bulk/expire', requirePermission('business:approve'), adminBusiness.adminBulkExpireBusinesses);
router.post('/businesses/bulk/renew', requirePermission('business:approve'), adminBusiness.adminBulkRenewBusinesses);
router.post('/businesses/bulk/resend-warnings', requirePermission('business:approve'), adminBusiness.adminBulkResendBusinessWarnings);


// Listings and reports
router.get('/listings', adminListings.adminListListings);
router.get('/listings/counts', adminListings.adminGetListingCounts);
router.get('/listings/:id', adminListings.adminGetListingById);

// Moderation Actions (Support both POST and PATCH for compatibility)
router.patch('/listings/:id/approve', requirePermission('ads:write'), adminListings.adminApproveListing);
router.post('/listings/:id/approve', requirePermission('ads:write'), adminListings.adminApproveListing);

router.patch('/listings/:id/reject', requirePermission('ads:write'), adminListings.adminRejectListing);
router.post('/listings/:id/reject', requirePermission('ads:write'), adminListings.adminRejectListing);

router.patch('/listings/:id/deactivate', requirePermission('ads:write'), adminListings.adminDeactivateListing);
router.post('/listings/:id/deactivate', requirePermission('ads:write'), adminListings.adminDeactivateListing);

router.patch('/listings/:id/expire', requirePermission('ads:write'), adminListings.adminExpireListing);
router.post('/listings/:id/expire', requirePermission('ads:write'), adminListings.adminExpireListing);

router.patch('/listings/:id/extend', requirePermission('ads:write'), adminListings.adminExtendListing);
router.post('/listings/:id/extend', requirePermission('ads:write'), adminListings.adminExtendListing);

router.patch('/listings/:id/report-resolve', requirePermission('ads:write'), adminListings.adminResolveListingReport);
router.post('/listings/:id/report-resolve', requirePermission('ads:write'), adminListings.adminResolveListingReport);
router.delete('/listings/:id', requirePermission('ads:write'), adminListings.adminSoftDeleteListing);

// Bulk Operations
router.post('/listings/bulk/approve', requirePermission('ads:write'), adminListings.adminBulkApproveListings);
router.post('/listings/bulk/reject', requirePermission('ads:write'), adminListings.adminBulkRejectListings);
router.post('/listings/bulk/deactivate', requirePermission('ads:write'), adminListings.adminBulkDeactivateListings);
router.post('/listings/bulk/expire', requirePermission('ads:write'), adminListings.adminBulkExpireListings);
router.post('/listings/bulk/extend', requirePermission('ads:write'), adminListings.adminBulkExtendListings);
router.post('/listings/bulk/resend-warnings', requirePermission('ads:write'), adminListings.adminBulkResendListingWarnings);
router.post('/listings/bulk/resend-spotlight-warnings', requirePermission('ads:write'), adminListings.adminBulkResendSpotlightWarnings);

router.get('/reports', adminReports.getReportedAds);
router.get('/reports/:id', adminReports.getReportedAdById);
router.patch('/reports/:id/resolve', requirePermission('ads:write'), adminReports.resolveReport);
router.patch('/reports/:id/status', requirePermission('ads:write'), adminReports.updateReportStatus);

// Finance
router.get('/finance/transactions', requirePermission('finance:read'), adminTransactions.getAllTransactions);
router.get('/finance/stats', requirePermission('finance:read'), adminTransactions.getTransactionStats);
router.get('/invoices', requirePermission('finance:read'), adminInvoices.getAllInvoices);
router.post('/invoices', requirePermission('finance:manage'), adminInvoices.createInvoice);
router.get('/invoices/:id', requirePermission('finance:read'), adminInvoices.getInvoiceById);
router.get('/invoices/:id/print', requirePermission('finance:read'), adminInvoices.getPrintableInvoice);

// Notifications, AI, API keys
router.post('/notifications/send', requirePermission('system:config'), adminNotifications.sendNotification);
router.get('/notifications/history', requirePermission('system:config'), adminNotifications.getHistory);
router.get('/notifications/recipients', requirePermission('system:config'), adminNotifications.getRecipients);

router.post('/ai/generate', requirePermission('system:config'), adminAi.generate);

router.get('/api-keys', requirePermission('system:config'), adminApiKeys.getApiKeys);
router.post('/api-keys', requirePermission('system:config'), adminApiKeys.createApiKey);
router.patch('/api-keys/:id/revoke', requirePermission('system:config'), adminApiKeys.revokeApiKey);

// Locations and geofences
router.get('/locations', requirePermission('system:config'), adminLocations.getAllLocations);
router.post('/locations', requirePermission('system:config'), adminLocations.createLocation);
router.get('/locations/analytics', adminSystem.getLocationAnalytics);
router.get('/locations/states', requirePermission('system:config'), adminLocations.getDistinctStates);
router.get('/locations/moderation-queue', requirePermission('system:config'), adminLocations.getModerationQueue);
router.post('/locations/refresh-stats', requirePermission('system:config'), adminLocations.refreshLocationStats);
router.patch('/locations/:id', requirePermission('system:config'), adminLocations.updateLocation);
router.patch('/locations/:id/toggle', requirePermission('system:config'), adminLocations.toggleLocationStatus);
router.patch('/locations/:id/review', requirePermission('system:config'), adminLocations.approveRejectLocation);
router.delete('/locations/:id', requirePermission('system:config'), adminLocations.deleteLocation);

router.get('/geofences', requirePermission('system:config'), adminLocations.getGeofences);
router.post('/geofences', requirePermission('system:config'), adminLocations.createGeofence);
router.get('/geofences/:id', requirePermission('system:config'), adminLocations.getGeofences);
router.patch('/geofences/:id', requirePermission('system:config'), adminLocations.updateGeofence);
router.delete('/geofences/:id', requirePermission('system:config'), adminLocations.deleteGeofence);

// System
router.get('/system/health', adminSystem.getSystemHealth);
router.get('/system/scan', requirePermission('system:config'), adminSystem.runSystemScan);
router.post('/system/fix', requirePermission('system:config'), adminSystem.applySystemFix);
router.get('/cache/health', adminSystem.getCacheHealth);

router.get('/system/config', adminSystemConfig.getSystemConfig);
router.patch('/system/config', requirePermission('system:config'), adminSystemConfig.updateSystemConfig);

router.get('/support/contact', adminSystem.getContactSubmissions);
router.patch('/support/contact/:id/status', adminSystem.updateContactSubmissionStatus);

// Admin operations
router.post('/import/bulk', requirePermission('system:config'), adminImportContent.bulkImport);
router.post('/import/seed-devices', requirePermission('system:config'), adminImportContent.seedDevices);

router.get('/smart-alerts', adminSmartAlerts.getAllSmartAlerts);
router.get('/smart-alerts/logs', adminSmartAlerts.getSmartAlertLogs);
router.delete('/smart-alerts/:id', requirePermission('ads:write'), adminSmartAlerts.deleteSmartAlertById);
router.post('/smart-alerts/bulk/resend-warnings', requirePermission('ads:write'), adminSmartAlerts.adminBulkResendAlertWarnings);

// Add these to respective sections if needed, but I'll add them near their bulk operations
// For clarity, I'll place them exactly where the other bulk operations are.

export default router;
