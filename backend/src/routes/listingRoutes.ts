import { Router } from "express";
import * as listingController from "../controllers/listingController";
import { protect, extractUser } from "../middleware/authMiddleware";
import { validateObjectId } from "../middleware/validateObjectId";
import { validateIdOrSlug } from "../middleware/validateIdOrSlug";
import { searchLimiter, mutationLimiter } from "../middleware/rateLimiter";

const router = Router();

/**
 * Protected Routes (Owner Only)
 */

// GET /api/v1/listings/mine/stats
// Unified fetch for user's listing counts across all types
router.get("/mine/stats", protect, listingController.getMyListingStats);

// GET /api/v1/listings/mine
// Unified fetch for user's own listings (all types)
router.get("/mine", protect, listingController.getMyListings);

/**
 * Public Routes
 */

// GET /api/v1/listings/:id
// Publicly fetch listing by ID or Slug
router.get("/:id", validateIdOrSlug('id'), extractUser, listingController.getListingDetail);

// GET /api/v1/listings/:id/view
// Increment view count (public)
router.get("/:id/view", validateObjectId, searchLimiter, listingController.incrementListingView);

// GET /api/v1/listings/:id/phone
// Reveal phone number (public with optional auth context)
router.get("/:id/phone", validateObjectId, extractUser, searchLimiter, listingController.getListingPhone);

// PUT /api/v1/listings/:id/edit
// Strict edit with ownership validation
router.put("/:id/edit", protect, validateObjectId, mutationLimiter, listingController.editListing);

// PUT /api/v1/listings/:id/mark-sold
// Terminal state transition
router.put("/:id/mark-sold", protect, validateObjectId, mutationLimiter, listingController.markListingSold);

// PATCH /api/v1/listings/:id/deactivate
// Lifecycle: LIVE -> DEACTIVATED
router.patch("/:id/deactivate", protect, validateObjectId, mutationLimiter, listingController.deactivateListing);

// POST /api/v1/listings/:id/promote
// Promotion entry point
router.post("/:id/promote", protect, validateObjectId, mutationLimiter, listingController.promoteListing);

// GET /api/v1/listings/:id/analytics
// Performance tracking
router.get("/:id/analytics", protect, validateObjectId, listingController.getListingAnalytics);

export default router;
