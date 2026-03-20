/**
 * SYSTEM ROUTES
 * Domain: Users, Admin Users, API Keys, Sessions, Audit, Notifications,
 *         Locations, Geofences, Code Health, System Config, Plans, Business
 */
import { Router } from 'express';
import { validateObjectId } from '../../middleware/validateObjectId';
import { requirePermission, requireSuperAdmin } from '../../middleware/adminAuth';
import { otpIpLimiter, searchLimiter, adminMutationLimiter } from '../../middleware/rateLimiter';
import { validateRequest } from '../../middleware/validateRequest';
import type { ZodTypeAny } from 'zod';

import * as usersController from '../../controllers/admin/adminUsersController';
import * as businessController from '../../controllers/admin/adminBusinessController';
import * as systemController from '../../controllers/admin/system';
import * as auditController from '../../controllers/admin/adminAuditController';
import * as analyticsController from '../../controllers/admin/adminAnalyticsController';
import * as apiKeyController from '../../controllers/admin/adminApiKeyController';
import * as adminSessionController from '../../controllers/admin/adminSessionController';
import * as notificationController from '../../controllers/admin/adminNotificationController';
import * as planController from '../../controllers/plan';
import * as codeHealthController from '../../controllers/admin/adminCodeHealthController';
import * as aiController from '../../controllers/ai';
import * as adminRevealController from '../../controllers/admin/adminRevealController';
import * as twoFAController from '../../controllers/admin/admin2FAController';
import { aiGenerateSchema } from '../../validators/ai.validator';
import { walletAdjustmentSchema } from '../../validators/wallet.validator';
import * as walletController from '../../controllers/wallet';
import importRoutes from '../importRoutes';
import {
    getAllLocations,
    createAreaLocation,
    createCityLocation,
    createLocation,
    createStateLocation,
    updateLocation,
    toggleLocationStatus,
    deleteLocation,
    getGeofences,
    createGeofence,
    updateGeofence,
    deleteGeofence,
    getModerationQueue,
    approveRejectLocation,
    refreshLocationStats,
    getDistinctStates,
} from '../../controllers/admin/adminLocationController';
import {
    getSystemConfig,
    updateSystemConfig,
    resetSystemConfig,
    testEmailConnection,
} from '../../controllers/admin/systemConfigController';

const router = Router();

// ============================================
// 2FA (Two-Factor Authentication)
// ============================================
router.get('/2fa/status', twoFAController.get2FAStatus);
router.post('/2fa/setup', twoFAController.setup2FA);
router.post('/2fa/verify', twoFAController.verify2FA);
router.post('/2fa/disable', twoFAController.disable2FA);

// ============================================
// DASHBOARD & ANALYTICS
// ============================================
router.get('/stats', searchLimiter, systemController.getStats);
router.get('/dashboard/stats', searchLimiter, systemController.getDashboardStats);
router.get('/analytics', searchLimiter, analyticsController.getTimeSeriesAnalytics);
router.get('/analytics/revenue/summary', searchLimiter, analyticsController.getRevenueSummary);
router.get('/analytics/revenue/categories', searchLimiter, analyticsController.getRevenueByCategory);
router.get('/activity', searchLimiter, systemController.getRecentActivity);
router.post('/ai/generate', adminMutationLimiter, validateRequest(aiGenerateSchema), aiController.generate);
router.get('/locations/analytics', searchLimiter, systemController.getLocationAnalytics);
router.get('/rate-limits/metrics', searchLimiter, systemController.getRateLimitMetrics);

// ============================================
// AUDIT LOGS
// ============================================
router.get('/security/audit', requirePermission('system:logs'), searchLimiter, auditController.getAuditLogs);
router.get('/audit-logs', requirePermission('system:logs'), searchLimiter, auditController.getAuditLogs);


router.get('/admin-sessions', requireSuperAdmin, requirePermission('system:logs'), searchLimiter, adminSessionController.getAdminSessions);
router.patch('/admin-sessions/:id/revoke', requireSuperAdmin, requirePermission('system:logs'), adminMutationLimiter, validateObjectId, adminSessionController.revokeAdminSessionById);

// ============================================
// PHONE REVEALS AUDIT
// ============================================
router.get('/phone-reveals/logs', requirePermission('system:logs'), searchLimiter, adminRevealController.getPhoneRevealLogs);
router.get('/phone-reveals/requests', requirePermission('ads:read'), searchLimiter, adminRevealController.getAllPhoneRequests);

// ============================================
// USERS
// ============================================
// ✅ STATIC / QUERY
router.get('/user-management/overview', requirePermission('users:read'), usersController.getUserManagementOverview);
router.get('/users/search', requirePermission('users:read'), usersController.searchUsers);
router.get('/users', requirePermission('users:read'), usersController.getUsers);

// ✅ ACTIONS
router.post('/users', requirePermission('users:write'), adminMutationLimiter, usersController.createUser);
router.patch('/users/:id/status', requirePermission('users:write'), adminMutationLimiter, validateObjectId, usersController.updateUserStatus);
router.patch('/users/:id/suspend', requirePermission('users:write'), adminMutationLimiter, validateObjectId, usersController.suspendUser);
router.patch('/users/:id/ban', requirePermission('users:write'), adminMutationLimiter, validateObjectId, usersController.banUser);
router.patch('/users/:id/verify', requirePermission('users:write'), adminMutationLimiter, validateObjectId, usersController.verifyUser);
router.patch('/users/:id/wallet', requirePermission('finance:manage'), adminMutationLimiter, validateObjectId, validateRequest(walletAdjustmentSchema as unknown as ZodTypeAny), walletController.adjustWallet);

// ✅ PARAM LAST
router.get('/users/:id', requirePermission('users:read'), validateObjectId, usersController.getUserById);
router.patch('/users/:id', requirePermission('users:write'), adminMutationLimiter, validateObjectId, usersController.updateUser);
router.delete('/users/:id', requirePermission('users:write'), adminMutationLimiter, validateObjectId, usersController.deleteUser);
router.patch('/users/:id/wallet', requirePermission('finance:manage'), adminMutationLimiter, validateObjectId, validateRequest(walletAdjustmentSchema as unknown as ZodTypeAny), walletController.adjustWallet);


router.get('/admin-users', requireSuperAdmin, usersController.getAdmins);
router.post('/admin-users', requireSuperAdmin, requirePermission('system:config'), adminMutationLimiter, usersController.createAdmin);
router.get('/admin-users/:id', requireSuperAdmin, validateObjectId, usersController.getAdminById);
router.patch('/admin-users/:id', requireSuperAdmin, adminMutationLimiter, validateObjectId, usersController.updateAdmin);
router.patch('/admin-users/:id/deactivate', requireSuperAdmin, adminMutationLimiter, validateObjectId, usersController.deactivateAdmin);
router.delete('/admin-users/:id', requireSuperAdmin, adminMutationLimiter, validateObjectId, usersController.deleteAdmin);

// ============================================
// PLANS
// ============================================
router.get('/plans', searchLimiter, planController.getPlans);
router.post('/plans', adminMutationLimiter, planController.createPlan);
router.put('/plans/:id', adminMutationLimiter, validateObjectId, planController.updatePlan);
router.patch('/plans/:id/toggle', adminMutationLimiter, validateObjectId, planController.togglePlan);

// ============================================
// BUSINESS
// ============================================
// ✅ STATIC
router.get('/businesses/overview', requirePermission('users:read'), businessController.getBusinessOverview);

// ✅ FILTER / QUERY
router.get('/businesses/accounts', requirePermission('users:read'), businessController.getBusinessAccounts);
router.get('/businesses/requests', requirePermission('users:read'), businessController.getBusinessRequests);

// ✅ ACTIONS
router.patch('/businesses/:id/approve', requirePermission('users:write'), adminMutationLimiter, validateObjectId, businessController.approveBusinessAccount);
router.patch('/businesses/:id/reject', requirePermission('users:write'), adminMutationLimiter, validateObjectId, businessController.rejectBusinessAccount);
router.patch('/businesses/:id/status', requirePermission('users:write'), adminMutationLimiter, validateObjectId, businessController.updateBusinessStatus);
router.post('/businesses/requests/:id/renew', requirePermission('users:write'), adminMutationLimiter, validateObjectId, businessController.renewBusinessAccount);

// ✅ PARAM LAST
router.get('/businesses/requests/:id', requirePermission('users:read'), validateObjectId, businessController.getBusinessAccountById);
router.get('/businesses/:id', requirePermission('users:read'), validateObjectId, businessController.getBusinessAccountById);
router.put('/businesses/:id', requirePermission('users:write'), adminMutationLimiter, validateObjectId, businessController.updateBusinessByAdmin);
router.delete('/businesses/:id', requirePermission('users:write'), adminMutationLimiter, validateObjectId, businessController.deleteBusinessAccount);


// ============================================
// API KEYS
// ============================================
router.get('/api-keys', requirePermission('system:config'), apiKeyController.getApiKeys);
router.post('/api-keys', requirePermission('system:config'), adminMutationLimiter, apiKeyController.createApiKey);
router.patch('/api-keys/:id/revoke', requirePermission('system:config'), adminMutationLimiter, validateObjectId, apiKeyController.revokeApiKey);

// ============================================
// NOTIFICATIONS
// ============================================
router.post('/notifications/send', adminMutationLimiter, notificationController.sendNotification);
router.get('/notifications/history', notificationController.getHistory);
router.post('/broadcast', requirePermission('content:write'), adminMutationLimiter, notificationController.createBroadcast);

// ============================================
// LOCATIONS
// ============================================
// ✅ STATIC
router.post('/locations/stats/refresh', requirePermission('system:config'), adminMutationLimiter, refreshLocationStats);
router.get('/locations/states', searchLimiter, getDistinctStates);
router.get('/locations/moderation', getModerationQueue);

// ✅ FILTER / QUERY
router.get('/locations', getAllLocations);

// ✅ ACTIONS
router.post('/locations/states', adminMutationLimiter, createStateLocation);
router.post('/locations/cities', adminMutationLimiter, createCityLocation);
router.post('/locations/areas', adminMutationLimiter, createAreaLocation);
router.post('/locations', adminMutationLimiter, createLocation);
router.patch('/locations/:id/toggle', validateObjectId, toggleLocationStatus);
router.post('/locations/:id/verify', adminMutationLimiter, validateObjectId, approveRejectLocation);

// ✅ PARAM LAST
router.put('/locations/:id', adminMutationLimiter, validateObjectId, updateLocation);
router.delete('/locations/:id', adminMutationLimiter, validateObjectId, deleteLocation);

// ============================================
// GEOFENCES
// ============================================
router.get('/geofences', getGeofences);
router.post('/geofences', adminMutationLimiter, createGeofence);
router.put('/geofences/:id', adminMutationLimiter, validateObjectId, updateGeofence);
router.delete('/geofences/:id', adminMutationLimiter, validateObjectId, deleteGeofence);

// ============================================
// SUPPORT & FEEDBACK
// ============================================
router.get('/support/contact', systemController.getContactSubmissions);
router.patch('/support/contact/:id/status', adminMutationLimiter, validateObjectId, systemController.updateContactSubmissionStatus);

// ============================================
// SYSTEM HEALTH & CODE HEALTH
// ============================================
router.get('/system/health', adminMutationLimiter, systemController.getSystemHealth);
router.post('/system/scan', adminMutationLimiter, systemController.runSystemScan);
router.post('/system/fix', adminMutationLimiter, systemController.applySystemFix);
router.get('/cache/health', adminMutationLimiter, systemController.getCacheHealth);

router.get('/code-health', codeHealthController.getCodeHealth);
router.post('/code-health/scan', adminMutationLimiter, codeHealthController.runCodeHealthScan);
router.get('/code-health/report', codeHealthController.getDeadCodeReport);
router.post('/code-health/approve', adminMutationLimiter, codeHealthController.approveDeadCodeRemoval);
router.post('/code-health/remove', adminMutationLimiter, codeHealthController.removeApprovedDeadCode);
router.get('/code-health/history', codeHealthController.getScanHistory);
router.get('/code-health/whitelist', codeHealthController.getWhitelist);
router.post('/code-health/whitelist', adminMutationLimiter, codeHealthController.addToWhitelist);
router.delete('/code-health/whitelist/:id', adminMutationLimiter, validateObjectId, codeHealthController.removeFromWhitelist);

// ============================================
// SYSTEM CONFIG / SETTINGS
// ============================================
router.get('/settings', requirePermission('system:config'), adminMutationLimiter, getSystemConfig);
router.patch('/settings', requirePermission('system:config'), adminMutationLimiter, updateSystemConfig);
router.put('/settings', requirePermission('system:config'), adminMutationLimiter, updateSystemConfig);
router.get('/system/config', requirePermission('system:config'), adminMutationLimiter, getSystemConfig);
router.patch('/system/config', requirePermission('system:config'), adminMutationLimiter, updateSystemConfig);
router.put('/system/config', requirePermission('system:config'), adminMutationLimiter, updateSystemConfig);



router.post('/system/config/reset', requirePermission('system:config'), adminMutationLimiter, resetSystemConfig);
router.post('/system/config/test-email', adminMutationLimiter, testEmailConnection);

// ============================================
// BULK IMPORT
// ============================================
router.use('/import', importRoutes);

export default router;
