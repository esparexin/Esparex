import express from 'express';
import * as serviceController from '../controllers/service';
import { protect, extractUser } from '../middleware/authMiddleware';
import { validateObjectId } from '../middleware/validateObjectId';
import { validateRequest } from '../middleware/validateRequest';
import { mutationLimiter, searchLimiter, phoneRevealLimiter } from '../middleware/rateLimiter';
import { ServicePayloadSchema, PartialServicePayloadSchema } from '../../../shared/schemas/servicePayload.schema';
import type { ZodTypeAny } from 'zod';
import { createListingValidator } from '../validators/listing.validator';

import { requireBusinessApproved } from '../middleware/businessMiddleware';
import { duplicateCooldownMiddleware } from '../middleware/duplicateCooldownMiddleware';

const router = express.Router();

// Protected CRUD (Business Only)
router.post(
    '/',
    protect,
    requireBusinessApproved,
    mutationLimiter,
    duplicateCooldownMiddleware('service'),
    validateRequest(ServicePayloadSchema as unknown as ZodTypeAny),
    createListingValidator,
    serviceController.createService
);
router.get('/my-services', protect, serviceController.getMyServices);
// router.get('/analytics', ...) — removed: admin-only endpoint moved exclusively to
// /api/v1/admin/services/analytics (adminRoutes.ts). Do not re-add here.

router.put(
    '/:id',
    protect,
    requireBusinessApproved,
    validateObjectId,
    validateRequest(PartialServicePayloadSchema as unknown as ZodTypeAny),
    serviceController.updateService
);
// Ownership verified in controller — no business approval needed to delete own listing
router.delete('/:id', protect, validateObjectId, serviceController.deleteService);
router.patch('/:id/sold', protect, validateObjectId, serviceController.markServiceAsSold);
router.patch('/:id/deactivate', protect, validateObjectId, serviceController.deactivateService);
router.post('/:id/repost', protect, validateObjectId, serviceController.repostService);

import { validateIdOrSlug } from '../middleware/validateIdOrSlug';

// Public Get
router.get('/', searchLimiter, serviceController.getServices);
router.get('/:id/view', searchLimiter, validateIdOrSlug('id'), serviceController.incrementServiceView);

router.get('/:id/phone', protect, validateObjectId, phoneRevealLimiter, serviceController.getServicePhone);

export default router;
