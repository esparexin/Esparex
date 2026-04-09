/**
 * SYSTEM ROUTES
 * Domain: Users, Admin Users, API Keys, Sessions, Audit, Notifications,
 *         Locations, Geofences, System Config, Plans, Business
 */
import { Router } from 'express';
import { validateObjectId } from '../../middleware/validateObjectId';
import { requirePermission, requireSuperAdmin } from '../../middleware/adminAuth';
import { searchLimiter, adminMutationLimiter } from '../../middleware/rateLimiter';
import { validateRequest } from '../../middleware/validateRequest';
import type { ZodTypeAny } from 'zod';
import { PlanPayloadSchema, PartialPlanPayloadSchema } from '../../../../shared/schemas/planPayload.schema';

import * as usersController from '../../controllers/admin/adminUsersController';
import * as businessController from '../../controllers/admin/adminBusinessController';
import * as systemController from '../../controllers/admin/system';
import * as auditController from '../../controllers/admin/adminAuditController';
import * as analyticsController from '../../controllers/admin/adminAnalyticsController';
import * as apiKeyController from '../../controllers/admin/adminApiKeyController';
import * as adminSessionController from '../../controllers/admin/adminSessionController';
import * as notificationController from '../../controllers/admin/adminNotificationController';
import * as planController from '../../controllers/plan';
import * as aiController from '../../controllers/ai';
import * as adminRevealController from '../../controllers/admin/adminRevealController';
import * as twoFAController from '../../controllers/admin/admin2FAController';
import { aiGenerateSchema } from '../../validators/ai.validator';
import {
    getUsersQuerySchema,
    updateUserStatusSchema,
    updateUserVerificationSchema,
} from '../../validators/user.validator';
import {
    adminBusinessAccountsQuerySchema,
    adminBusinessRejectSchema,
    adminBusinessStatusSchema,
    adminBusinessUpdateSchema,
} from '../../validators/business.validator';
import { walletAdjustmentSchema } from '../../validators/wallet.validator';
import { adminPlanQuerySchema } from '../../validators/finance.validator';
import {
    adminCreateAreaLocationSchema,
    adminCreateCityLocationSchema,
    adminCreateGeofenceSchema,
    adminCreateLocationSchema,
    adminCreateStateLocationSchema,
    adminLocationAnalyticsQuerySchema,
    adminLocationListQuerySchema,
    adminUpdateGeofenceSchema,
    adminUpdateLocationSchema,
    adminVerifyLocationSchema,
} from '../../validators/location.validator';
import {
    adminNotificationHistoryQuerySchema,
    adminNotificationRecipientQuerySchema,
    adminNotificationSendSchema,
} from '../../validators/notificationValidators';
import * as walletController from '../../controllers/wallet';
import importRoutes from '../importRoutes';
import {
    adminListChats,
    adminGetChat,
    adminDeleteMsg,
    adminMuteChat,
    adminExportChat,
    adminResolveReport,
} from '../../controllers/chat/chatAdminController';
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
    runLocationPathMigration,
    getDistinctStates,
} from '../../controllers/admin/adminLocationController';
import {
    getSystemConfig,
    updateSystemConfig,
} from '../../controllers/admin/systemConfigController';
import { ADMIN_PERMISSION_KEYS } from '../../constants/adminPermissions';
import { systemConfigUpdateSchema } from '../../validators/systemConfig.validator';

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
router.get('/locations/analytics', requirePermission('system:config'), searchLimiter, validateRequest({ query: adminLocationAnalyticsQuerySchema }), systemController.getLocationAnalytics);
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
router.get('/users', requirePermission('users:read'), validateRequest({ query: getUsersQuerySchema }), usersController.getUsers);

// ✅ ACTIONS
router.post('/users', requirePermission('users:write'), adminMutationLimiter, usersController.createUser);
router.patch('/users/:id/status', requirePermission('users:write'), adminMutationLimiter, validateObjectId, validateRequest(updateUserStatusSchema), usersController.updateUserStatus);
router.patch('/users/:id/verify', requirePermission('users:write'), adminMutationLimiter, validateObjectId, validateRequest(updateUserVerificationSchema), usersController.verifyUser);
router.patch('/users/:id/wallet', requirePermission('finance:manage'), adminMutationLimiter, validateObjectId, validateRequest(walletAdjustmentSchema as unknown as ZodTypeAny), walletController.adjustWallet);

// ✅ PARAM LAST
router.get('/users/:id', requirePermission('users:read'), validateObjectId, usersController.getUserById);
router.patch('/users/:id', requirePermission('users:write'), adminMutationLimiter, validateObjectId, usersController.updateUser);
router.delete('/users/:id', requirePermission('users:write'), adminMutationLimiter, validateObjectId, usersController.deleteUser);


router.get('/admin-users', requireSuperAdmin, usersController.getAdmins);
router.post('/admin-users', requireSuperAdmin, requirePermission('system:config'), adminMutationLimiter, usersController.createAdmin);
router.get('/admin-users/:id', requireSuperAdmin, validateObjectId, usersController.getAdminById);
router.patch('/admin-users/:id', requireSuperAdmin, adminMutationLimiter, validateObjectId, usersController.updateAdmin);
router.patch('/admin-users/:id/deactivate', requireSuperAdmin, adminMutationLimiter, validateObjectId, usersController.deactivateAdmin);
router.delete('/admin-users/:id', requireSuperAdmin, adminMutationLimiter, validateObjectId, usersController.deleteAdmin);

// ============================================
// PLANS
// ============================================
router.get('/plans', requirePermission('finance:read'), searchLimiter, validateRequest({ query: adminPlanQuerySchema }), planController.getPlans);
router.post('/plans', requirePermission('finance:manage'), adminMutationLimiter, validateRequest(PlanPayloadSchema as unknown as ZodTypeAny), planController.createPlan);
router.put('/plans/:id', requirePermission('finance:manage'), adminMutationLimiter, validateObjectId, validateRequest(PartialPlanPayloadSchema as unknown as ZodTypeAny), planController.updatePlan);
router.patch('/plans/:id/toggle', requirePermission('finance:manage'), adminMutationLimiter, validateObjectId, planController.togglePlan);

// ============================================
// BUSINESS
// ============================================
// ✅ STATIC
router.get('/businesses/overview', requirePermission('users:read'), businessController.getBusinessOverview);

// ✅ FILTER / QUERY
router.get('/businesses/accounts', requirePermission('users:read'), searchLimiter, validateRequest({ query: adminBusinessAccountsQuerySchema }), businessController.getBusinessAccounts);

// ✅ ACTIONS
router.patch('/businesses/:id/approve', requirePermission('users:write'), adminMutationLimiter, validateObjectId, businessController.approveBusinessAccount);
router.patch('/businesses/:id/reject', requirePermission('users:write'), adminMutationLimiter, validateObjectId, validateRequest({ body: adminBusinessRejectSchema }), businessController.rejectBusinessAccount);
router.patch('/businesses/:id/status', requirePermission('users:write'), adminMutationLimiter, validateObjectId, validateRequest({ body: adminBusinessStatusSchema }), businessController.updateBusinessStatus);

// ✅ PARAM LAST
router.get('/businesses/:id', requirePermission('users:read'), validateObjectId, businessController.getBusinessAccountById);
router.put('/businesses/:id', requirePermission('users:write'), adminMutationLimiter, validateObjectId, validateRequest({ body: adminBusinessUpdateSchema }), businessController.updateBusinessByAdmin);
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
router.post('/notifications/send', requirePermission('content:write'), adminMutationLimiter, validateRequest({ body: adminNotificationSendSchema }), notificationController.sendNotification);
router.get('/notifications/history', requirePermission('content:read'), searchLimiter, validateRequest({ query: adminNotificationHistoryQuerySchema }), notificationController.getHistory);
router.get('/notifications/recipients', requirePermission('content:write'), searchLimiter, validateRequest({ query: adminNotificationRecipientQuerySchema }), notificationController.getRecipients);

// ============================================
// LOCATIONS
// ============================================
// ✅ STATIC
router.post('/locations/stats/refresh', requirePermission('system:config'), adminMutationLimiter, refreshLocationStats);
router.post('/locations/migrate-paths', requirePermission('system:config'), adminMutationLimiter, runLocationPathMigration);
router.get('/locations/states', requirePermission('system:config'), searchLimiter, getDistinctStates);
router.get('/locations/moderation', requirePermission('system:config'), getModerationQueue);

// ✅ FILTER / QUERY
router.get('/locations', requirePermission('system:config'), searchLimiter, validateRequest({ query: adminLocationListQuerySchema }), getAllLocations);

// ✅ ACTIONS
router.post('/locations/states', requirePermission('system:config'), adminMutationLimiter, validateRequest({ body: adminCreateStateLocationSchema }), createStateLocation);
router.post('/locations/cities', requirePermission('system:config'), adminMutationLimiter, validateRequest({ body: adminCreateCityLocationSchema }), createCityLocation);
router.post('/locations/areas', requirePermission('system:config'), adminMutationLimiter, validateRequest({ body: adminCreateAreaLocationSchema }), createAreaLocation);
router.post('/locations', requirePermission('system:config'), adminMutationLimiter, validateRequest({ body: adminCreateLocationSchema }), createLocation);
router.patch('/locations/:id/toggle', requirePermission('system:config'), adminMutationLimiter, validateObjectId, toggleLocationStatus);
router.post('/locations/:id/verify', requirePermission('system:config'), adminMutationLimiter, validateObjectId, validateRequest({ body: adminVerifyLocationSchema }), approveRejectLocation);

// ✅ PARAM LAST
router.put('/locations/:id', requirePermission('system:config'), adminMutationLimiter, validateObjectId, validateRequest({ body: adminUpdateLocationSchema }), updateLocation);
router.delete('/locations/:id', requirePermission('system:config'), adminMutationLimiter, validateObjectId, deleteLocation);

// ============================================
// GEOFENCES
// ============================================
router.get('/geofences', requirePermission('system:config'), getGeofences);
router.post('/geofences', requirePermission('system:config'), adminMutationLimiter, validateRequest({ body: adminCreateGeofenceSchema }), createGeofence);
router.put('/geofences/:id', requirePermission('system:config'), adminMutationLimiter, validateObjectId, validateRequest({ body: adminUpdateGeofenceSchema }), updateGeofence);
router.delete('/geofences/:id', requirePermission('system:config'), adminMutationLimiter, validateObjectId, deleteGeofence);

// ============================================
// SUPPORT & FEEDBACK
// ============================================
router.get('/support/contact', systemController.getContactSubmissions);
router.patch('/support/contact/:id/status', adminMutationLimiter, validateObjectId, systemController.updateContactSubmissionStatus);

// ============================================
// SYSTEM HEALTH & CODE HEALTH
// ============================================
router.get('/system/health', requirePermission('system:config'), adminMutationLimiter, systemController.getSystemHealth);
router.post('/system/scan', requirePermission('system:config'), adminMutationLimiter, systemController.runSystemScan);
router.post('/system/fix', requirePermission('system:config'), adminMutationLimiter, systemController.applySystemFix);
router.get('/cache/health', requirePermission('system:config'), adminMutationLimiter, systemController.getCacheHealth);


// ============================================
// SYSTEM CONFIG / SETTINGS
// ============================================
router.get('/system/config', requirePermission('system:config'), searchLimiter, getSystemConfig);
router.patch('/system/config', requirePermission('system:config'), adminMutationLimiter, validateRequest(systemConfigUpdateSchema), updateSystemConfig);
router.put('/system/config', requirePermission('system:config'), adminMutationLimiter, validateRequest(systemConfigUpdateSchema), updateSystemConfig);

// ============================================
// CHAT MODERATION (admin access via /api/v1/admin/chat/*)
// ============================================
router.get('/chat/list', requirePermission(ADMIN_PERMISSION_KEYS.CHAT_READ), adminListChats);
router.get('/chat/:id', requirePermission(ADMIN_PERMISSION_KEYS.CHAT_READ), adminGetChat);
router.delete('/chat/message/:msgId', requirePermission(ADMIN_PERMISSION_KEYS.CHAT_WRITE), adminMutationLimiter, adminDeleteMsg);
router.post('/chat/mute/:id', requirePermission(ADMIN_PERMISSION_KEYS.CHAT_WRITE), adminMutationLimiter, adminMuteChat);
router.post('/chat/export/:id', requirePermission(ADMIN_PERMISSION_KEYS.CHAT_READ), adminExportChat);
router.patch('/chat/report/:id', requirePermission(ADMIN_PERMISSION_KEYS.CHAT_WRITE), adminMutationLimiter, adminResolveReport);

// ============================================
// BULK IMPORT
// ============================================
router.use('/import', importRoutes);

export default router;
