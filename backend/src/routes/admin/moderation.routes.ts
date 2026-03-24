/**
 * MODERATION ROUTES
 * Canonical namespace: /api/v1/admin/listings*
 * Legacy aliases are preserved via controlled deprecation facade.
 */
import express from 'express';
import { validateObjectId } from '../../middleware/validateObjectId';
import { requirePermission } from '../../middleware/adminAuth';
import { adminMutationLimiter } from '../../middleware/rateLimiter';
import { lifecyclePolicyHttpGuard } from '../../middleware/lifecyclePolicyGuard';
import * as listingsController from '../../controllers/admin/adminListingsController';
import * as legacyReportsController from '../../controllers/admin/adminAdsController';

const router = express.Router();

// ============================================
// CANONICAL LISTINGS MODERATION API (SSOT)
// ============================================
router.get('/listings/counts', requirePermission('ads:read'), listingsController.adminGetListingCounts);
router.get('/listings', requirePermission('ads:read'), listingsController.adminListListings);
router.get('/listings/:id', requirePermission('ads:read'), validateObjectId, listingsController.adminGetListingById);

router.post('/listings/:id/approve', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminApproveListing);
router.post('/listings/:id/reject', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminRejectListing);
router.post('/listings/:id/deactivate', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminDeactivateListing);
router.post('/listings/:id/expire', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminExpireListing);
router.post('/listings/:id/extend', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminExtendListing);
router.post('/listings/:id/report-resolve', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminResolveListingReport);
router.delete('/listings/:id', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminSoftDeleteListing);

// ============================================
// REPORTS (kept for admin operations)
// ============================================
router.get('/reports', requirePermission('ads:read'), legacyReportsController.getReportedAds);
router.get('/reports/:id', requirePermission('ads:read'), validateObjectId, legacyReportsController.getReportedAdById);
router.post('/reports/:id/resolve', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, legacyReportsController.resolveReport);
router.patch('/reports/:id/status', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, legacyReportsController.updateReportStatus);

export default router;
