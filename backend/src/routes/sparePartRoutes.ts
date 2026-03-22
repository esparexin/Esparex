import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { requireBusinessApproved } from '../middleware/businessMiddleware';
import { validateObjectId } from '../middleware/validateObjectId';
import * as sparePartListingController from '../controllers/sparePartListingController';
import { duplicateCooldownMiddleware } from '../middlewares/duplicateCooldownMiddleware';
import { createListingValidator } from '../validators/listing.validator';
import { phoneRevealLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validateRequest';
import type { ZodTypeAny } from 'zod';
import { SparePartPayloadSchema, PartialSparePartPayloadSchema } from '../../../shared/schemas/sparePartPayload.schema';

const router = Router();

/**
 * @route   POST /api/v1/spare-part-listings
 * @desc    Create a new spare part listing (Requires Approved Business)
 * @access  Private (Business)
 */
router.post(
    '/',
    protect,
    requireBusinessApproved,
    duplicateCooldownMiddleware('spare_part'),
    validateRequest(SparePartPayloadSchema as unknown as ZodTypeAny),
    createListingValidator,
    sparePartListingController.createSparePartListing
);

/**
 * @route   GET /api/v1/spare-part-listings/my-listings
 * @desc    Get listings owned by the authenticated user (Private)
 * @access  Private — owner only, no business approval required
 * Note: requireBusinessApproved intentionally omitted — users must always be
 * able to view their own listings even if their business is later revoked.
 */
router.get(
    '/my-listings',
    protect,
    sparePartListingController.getMySparePartListings
);

/**
 * @route   GET /api/v1/spare-part-listings
 * @desc    Get all spare part listings (Public)
 * @access  Public
 */
router.get('/', sparePartListingController.getSparePartListings);

/**
 * @route   GET /api/v1/spare-part-listings/:id/phone
 * @desc    Reveal seller phone for a spare part listing
 * @access  Private
 */
router.get('/:id/phone', protect, validateObjectId, phoneRevealLimiter, sparePartListingController.getSparePartPhone);

/**
 * @route   GET /api/v1/spare-part-listings/:idOrSlug
 * @desc    Get single spare part listing (Public)
 * @access  Public
 */
router.get('/:idOrSlug', sparePartListingController.getSparePartListing);

/**
 * @route   PUT /api/v1/spare-part-listings/:id
 * @desc    Update a spare part listing (Owner only)
 * @access  Private (Business)
 */
router.put(
    '/:id',
    protect,
    requireBusinessApproved,
    validateObjectId,
    validateRequest(PartialSparePartPayloadSchema as unknown as ZodTypeAny),
    sparePartListingController.updateSparePartListing
);

/**
 * @route   DELETE /api/v1/spare-part-listings/:id
 * @desc    Soft-delete own spare part listing (Owner only)
 * @access  Private — ownership verified in controller, no business approval required
 */
router.delete(
    '/:id',
    protect,
    validateObjectId,
    sparePartListingController.deleteSparePartListing
);

export default router;
