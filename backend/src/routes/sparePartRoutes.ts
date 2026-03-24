import { Router } from 'express';
import { protect, extractUser } from '../middleware/authMiddleware';
import { requireBusinessApproved } from '../middleware/businessMiddleware';
import { validateObjectId } from '../middleware/validateObjectId';
import * as sparePartListingController from '../controllers/sparePartListingController';
import { duplicateCooldownMiddleware } from '../middlewares/duplicateCooldownMiddleware';
import { createListingValidator } from '../validators/listing.validator';
import { phoneRevealLimiter } from '../middleware/rateLimiter';

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
    createListingValidator,
    sparePartListingController.createSparePartListing
);

/**
 * @route   GET /api/v1/spare-part-listings/my-listings
 * @desc    Get listings for the authenticated business (Private)
 * @access  Private (Business)
 */
router.get(
    '/my-listings',
    protect,
    requireBusinessApproved,
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
router.get('/:idOrSlug', extractUser, sparePartListingController.getSparePartListing);

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
    sparePartListingController.updateSparePartListing
);

/**
 * @route   DELETE /api/v1/spare-part-listings/:id
 * @desc    Delete (soft) a spare part listing (Owner only)
 * @access  Private (Business)
 */
router.delete(
    '/:id',
    protect,
    requireBusinessApproved,
    validateObjectId,
    sparePartListingController.deleteSparePartListing
);

export default router;
