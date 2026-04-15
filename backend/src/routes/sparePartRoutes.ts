import { Router } from 'express';
import { protect, extractUser } from '../middleware/authMiddleware';
import { requireBusinessApproved } from '../middleware/businessMiddleware';
import { validateObjectId } from '../middleware/validateObjectId';
import * as sparePartListingController from '../controllers/sparePartListing/sparePartListingController';
import * as listingController from '../controllers/listing/listingController';
import { duplicateCooldownMiddleware } from '../middleware/duplicateCooldownMiddleware';
import { createListingValidator } from '../validators/listing.validator';
import { phoneRevealLimiter } from '../middleware/rateLimiter';

import { validateRequest } from '../middleware/validateRequest';
import type { ZodTypeAny } from 'zod';
import { SparePartPayloadSchema, PartialSparePartPayloadSchema } from '../../../shared/schemas/sparePartPayload.schema';
import { requireListingType } from '../middleware/requireListingType';
import { LISTING_TYPE } from '../../../shared/enums/listingType';

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
    requireListingType(LISTING_TYPE.SPARE_PART),
    duplicateCooldownMiddleware(LISTING_TYPE.SPARE_PART),
    validateRequest(SparePartPayloadSchema as unknown as ZodTypeAny),
    createListingValidator,
    sparePartListingController.createSparePartListing
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
 * @access  Public with optional auth context
 */
router.get('/:id/phone', validateObjectId, extractUser, phoneRevealLimiter, listingController.getListingPhone);



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
    validateRequest(PartialSparePartPayloadSchema.passthrough() as unknown as ZodTypeAny),
    sparePartListingController.updateSparePartListing
);

// D3: Lifecycle routes now fully delegated to generic listingRoutes.ts


export default router;
