/**
 * MODERATION ROUTES
 * Canonical namespace: /api/v1/admin/listings*
 * Historical aliases are preserved via controlled support facade.
 */
import express from 'express';
import { validateObjectId } from '../../middleware/validateObjectId';
import { requirePermission } from '../../middleware/adminAuth';
import { adminMutationLimiter } from '../../middleware/rateLimiter';
import { lifecyclePolicyHttpGuard } from '../../middleware/lifecyclePolicyGuard';
import { validateRequest } from '../../middleware/validateRequest';
import * as listingsController from '../../controllers/admin/adminListingsController';
import * as reportsController from '../../controllers/admin/adminReportsController';
import {
    adminModerationListingsQuerySchema,
    adminReportedAdsQuerySchema,
} from '@core/validators/adminModeration.validator';

const router = express.Router();

// ============================================
// CANONICAL LISTINGS MODERATION API (SSOT)
// ============================================
router.get('/listings/counts', requirePermission('ads:read'), listingsController.adminGetListingCounts);
router.get('/listings', requirePermission('ads:read'), validateRequest({ query: adminModerationListingsQuerySchema }), listingsController.adminListListings);
router.get('/listings/:id', requirePermission('ads:read'), validateObjectId, listingsController.adminGetListingById);

router.post('/listings', requirePermission('ads:write'), adminMutationLimiter, lifecyclePolicyHttpGuard, listingsController.adminCreateListing);
router.patch('/listings/:id', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminUpdateListing);

router.post('/listings/:id/approve', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminApproveListing);
router.post('/listings/:id/reject', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminRejectListing);
router.post('/listings/:id/deactivate', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminDeactivateListing);
router.post('/listings/:id/expire', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminExpireListing);
router.post('/listings/:id/extend', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminExtendListing);
router.post('/listings/:id/report-resolve', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminResolveListingReport);
router.delete('/listings/:id', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminSoftDeleteListing);

// ============================================
// REPORTS (Canonical SSOT)
// ============================================
router.get('/reports', requirePermission('ads:read'), validateRequest({ query: adminReportedAdsQuerySchema }), reportsController.getReportedAds);
router.get('/reports/:id', requirePermission('ads:read'), validateObjectId, reportsController.getReportedAdById);
router.post('/reports/:id/resolve', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, reportsController.resolveReport);
router.patch('/reports/:id/status', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, reportsController.updateReportStatus);

// ============================================
// HISTORICAL ALIASES (Sunset mapping to Listings)
// ============================================
router.get('/ads/counts', requirePermission('ads:read'), listingsController.adminGetListingCountsLegacyAdapter);
router.get('/ads', requirePermission('ads:read'), validateRequest({ query: adminModerationListingsQuerySchema }), listingsController.adminListListings);
router.get('/ads/:id', requirePermission('ads:read'), validateObjectId, listingsController.adminGetListingById);

router.post('/ads', requirePermission('ads:write'), adminMutationLimiter, lifecyclePolicyHttpGuard, listingsController.adminCreateListing);
router.patch('/ads/:id', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminUpdateListing);
router.post('/ads/:id/approve', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminApproveListing);
router.post('/ads/:id/reject', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminRejectListing);
router.post('/ads/:id/deactivate', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminDeactivateListing);
router.post('/ads/:id/expire', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminExpireListing);
router.post('/ads/:id/extend', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminExtendListing);
router.delete('/ads/:id', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminSoftDeleteListing);

export default router;
