/**
 * MODERATION ROUTES
 * Canonical namespace: /api/v1/admin/listings*
 * Legacy aliases are preserved via controlled deprecation facade.
 */
import express, { type RequestHandler } from 'express';
import { validateObjectId } from '../../middleware/validateObjectId';
import { requirePermission } from '../../middleware/adminAuth';
import { searchLimiter, adminMutationLimiter } from '../../middleware/rateLimiter';
import { lifecyclePolicyHttpGuard } from '../../middleware/lifecyclePolicyGuard';
import logger from '../../utils/logger';
import { LISTING_TYPE, type ListingTypeValue } from '../../../../shared/enums/listingType';
import AdminMetrics from '../../models/AdminMetrics';
import * as listingsController from '../../controllers/admin/adminListingsController';
import * as legacyReportsController from '../../controllers/admin/adminAdsController';
import * as serviceController from '../../controllers/service';

const SUNSET = 'Wed, 31 Dec 2026 23:59:59 GMT';
const ENABLE_LEGACY_ALIASES = process.env.ENABLE_LEGACY_MODERATION_ALIASES === 'true';

const recordLegacyAliasEnableMetric = async () => {
    const aggregationDate = new Date();
    aggregationDate.setHours(0, 0, 0, 0);
    await AdminMetrics.findOneAndUpdate(
        { metricModule: 'legacy_route_usage_total', aggregationDate },
        { $inc: { 'payload.moderation_alias_enabled': 1 } },
        { upsert: true }
    );
};

if (ENABLE_LEGACY_ALIASES) {
    logger.warn('[ModerationRoutes] Legacy moderation alias routes are ENABLED. This should only be used for emergency rollback.');
    void recordLegacyAliasEnableMetric().catch((error) => {
        logger.error('[ModerationRoutes] Failed to record legacy alias enable metric', {
            error: error instanceof Error ? error.message : String(error),
        });
    });
}

const legacyAlias = (successorPath: string): RequestHandler => (req, res, next) => {
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', SUNSET);
    res.setHeader('Link', `<${successorPath}>; rel="successor-version"`);
    res.setHeader('X-Esparex-Legacy-Alias', 'true');
    res.setHeader('X-Deprecated-Endpoint', 'true');
    logger.warn(`Deprecated API route used: ${req.originalUrl}`, {
        method: req.method,
        originalUrl: req.originalUrl,
        successorPath,
    });
    next();
};

const withForcedListingType = (listingType: Exclude<ListingTypeValue, 'ad'>): RequestHandler => (req, _res, next) => {
    req.query = { ...req.query, listingType };
    next();
};

const withForcedStatus = (status: string): RequestHandler => (req, _res, next) => {
    req.query = { ...req.query, status };
    next();
};

const retiredLegacyMutation = (message: string, canonicalPath: string): RequestHandler => (_req, res) => {
    res.status(410).json({
        success: false,
        status: 410,
        error: message,
        canonical: canonicalPath,
    });
};

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
router.post('/listings/:id/report-resolve', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminResolveListingReport);
router.delete('/listings/:id', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminSoftDeleteListing);

// ============================================
// REPORTS (kept for admin operations)
// ============================================
router.get('/reports', requirePermission('ads:read'), legacyReportsController.getReportedAds);
router.get('/reports/:id', requirePermission('ads:read'), validateObjectId, legacyReportsController.getReportedAdById);
router.post('/reports/:id/resolve', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, legacyReportsController.resolveReport);
router.patch('/reports/:id/status', requirePermission('ads:write'), adminMutationLimiter, validateObjectId, legacyReportsController.updateReportStatus);

if (ENABLE_LEGACY_ALIASES) {
    // ============================================
    // LEGACY ADS ALIASES -> LISTINGS FACADE
    // ============================================
    router.get('/ads/summary', legacyAlias('/api/v1/admin/listings/counts'), requirePermission('ads:read'), listingsController.adminGetListingCountsLegacyAdapter);
    router.get('/ad-review/stats', legacyAlias('/api/v1/admin/listings/counts'), requirePermission('ads:read'), listingsController.adminGetListingCountsLegacyAdapter);
    router.get('/ad-review/queue', legacyAlias('/api/v1/admin/listings?status=pending'), requirePermission('ads:read'), withForcedStatus('pending'), listingsController.adminListListings);

    router.get('/ads', legacyAlias('/api/v1/admin/listings'), requirePermission('ads:read'), listingsController.adminListListings);
    router.post('/ads/:id/extend', legacyAlias('/api/v1/admin/listings/:id/approve'), requirePermission('ads:write'), adminMutationLimiter, validateObjectId, retiredLegacyMutation('Legacy extend endpoint retired. Use moderation approval workflow.', '/api/v1/admin/listings/:id/approve'));
    router.post('/ads/:id/promote', legacyAlias('/api/v1/admin/listings/:id/deactivate'), requirePermission('ads:write'), adminMutationLimiter, validateObjectId, retiredLegacyMutation('Legacy promote endpoint retired from moderation surface.', '/api/v1/admin/listings/:id'));
    router.post('/ads/:id/restore', legacyAlias('/api/v1/admin/listings/:id/approve'), requirePermission('ads:write'), adminMutationLimiter, validateObjectId, retiredLegacyMutation('Legacy restore endpoint retired. Repost through user workflow for review.', '/api/v1/ads/:id/repost'));
    router.get('/ads/:id', legacyAlias('/api/v1/admin/listings/:id'), requirePermission('ads:read'), validateObjectId, listingsController.adminGetListingById);
    router.patch('/ads/:id/approve', legacyAlias('/api/v1/admin/listings/:id/approve'), requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminApproveListing);
    router.patch('/ads/:id/reject', legacyAlias('/api/v1/admin/listings/:id/reject'), requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminRejectListing);
    router.patch('/ads/:id/status', legacyAlias('/api/v1/admin/listings/:id/deactivate|approve'), requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, async (req, res) => {
        const status = typeof req.body?.status === 'string' ? req.body.status.trim().toLowerCase() : '';
        if (status === 'live') return listingsController.adminApproveListing(req, res);
        if (status === 'deactivated') return listingsController.adminDeactivateListing(req, res);
        if (status === 'expired') return listingsController.adminExpireListing(req, res);
        return res.status(400).json({ success: false, error: 'Legacy status route supports only live/deactivated/expired', status: 400, path: req.originalUrl });
    });
    router.delete('/ads/:id', legacyAlias('/api/v1/admin/listings/:id'), requirePermission('ads:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminSoftDeleteListing);

    // ============================================
    // LEGACY SERVICES ALIASES -> LISTINGS FACADE
    // ============================================
    router.get('/services/summary', legacyAlias('/api/v1/admin/listings/counts?listingType=service'), requirePermission('services:read'), withForcedListingType('service'), listingsController.adminGetListingCountsLegacyAdapter);
    router.get('/services/analytics', requirePermission('services:read'), searchLimiter, serviceController.getServiceAnalytics);
    router.get('/services', legacyAlias('/api/v1/admin/listings?listingType=service'), requirePermission('services:read'), withForcedListingType('service'), listingsController.adminListListings);
    router.get('/services/:id', legacyAlias('/api/v1/admin/listings/:id'), requirePermission('services:read'), validateObjectId, listingsController.adminGetListingById);
    router.patch('/services/:id/approve', legacyAlias('/api/v1/admin/listings/:id/approve'), requirePermission('services:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminApproveListing);
    router.patch('/services/:id/reject', legacyAlias('/api/v1/admin/listings/:id/reject'), requirePermission('services:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminRejectListing);
    router.patch('/services/:id/status', legacyAlias('/api/v1/admin/listings/:id/deactivate|approve'), requirePermission('services:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, async (req, res) => {
        const status = typeof req.body?.status === 'string' ? req.body.status.trim().toLowerCase() : '';
        if (status === 'live') return listingsController.adminApproveListing(req, res);
        if (status === 'deactivated') return listingsController.adminDeactivateListing(req, res);
        if (status === 'expired') return listingsController.adminExpireListing(req, res);
        return res.status(400).json({ success: false, error: 'Legacy status route supports only live/deactivated/expired', status: 400, path: req.originalUrl });
    });
    router.delete('/services/:id', legacyAlias('/api/v1/admin/listings/:id'), requirePermission('services:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminSoftDeleteListing);

    // ============================================
    // LEGACY SPARE PART LISTING ALIASES -> LISTINGS FACADE
    // ============================================
    router.get('/spare-part-listings/summary', legacyAlias('/api/v1/admin/listings/counts?listingType=spare_part'), requirePermission('spare_parts:read'), withForcedListingType('spare_part'), listingsController.adminGetListingCountsLegacyAdapter);
    router.get('/spare-part-listings', legacyAlias('/api/v1/admin/listings?listingType=spare_part'), requirePermission('spare_parts:read'), withForcedListingType('spare_part'), listingsController.adminListListings);
    router.patch('/spare-part-listings/:id/approve', legacyAlias('/api/v1/admin/listings/:id/approve'), requirePermission('spare_parts:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminApproveListing);
    router.patch('/spare-part-listings/:id/reject', legacyAlias('/api/v1/admin/listings/:id/reject'), requirePermission('spare_parts:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminRejectListing);
    router.patch('/spare-part-listings/:id/deactivate', legacyAlias('/api/v1/admin/listings/:id/deactivate'), requirePermission('spare_parts:write'), adminMutationLimiter, validateObjectId, lifecyclePolicyHttpGuard, listingsController.adminDeactivateListing);

    // ============================================
    // LEGACY REPORT ALIASES
    // ============================================
    router.get('/reported-ads', legacyAlias('/api/v1/admin/reports'), requirePermission('ads:read'), (req, res) => res.redirect(308, '/api/v1/admin/reports'));
    router.get('/reported-ads/:id', legacyAlias('/api/v1/admin/reports/:id'), requirePermission('ads:read'), validateObjectId, (req, res) => res.redirect(308, `/api/v1/admin/reports/${req.params.id}`));
    router.post('/reported-ads/:id/resolve', legacyAlias('/api/v1/admin/reports/:id/resolve'), requirePermission('ads:write'), adminMutationLimiter, validateObjectId, legacyReportsController.resolveReport);
}

export default router;
