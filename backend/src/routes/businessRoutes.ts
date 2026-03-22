import express from 'express';
import * as businessController from '../controllers/business';
import { protect, extractUser } from '../middleware/authMiddleware';
import { mutationLimiter } from '../middleware/rateLimiter';
import { validateObjectId } from '../middleware/validateObjectId';
import { validateIdOrSlug } from '../middleware/validateIdOrSlug';
import { validateRequest } from '../middleware/validateRequest';
import { createBusinessSchema, updateBusinessSchema } from '../validators/business.validator';

import { idempotencyMiddleware } from '../middleware/idempotency';
import multer from 'multer';
import os from 'os';
import { createUploadMiddleware } from '../utils/uploadFactory';
import { uploadFile } from '../controllers/user';

const router = express.Router();

// ─── Business-owned upload middleware ─────────────────────────────────────────
// Accepts images AND documents (PDF) — intentionally wider than the user
// avatar endpoint which only accepts image/* types.
const ALLOWED_BUSINESS_UPLOAD_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
];

// Widened upload config for businesses (includes PDF)
const businessUpload = createUploadMiddleware({
    allowedMimeTypes: ALLOWED_BUSINESS_UPLOAD_TYPES,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    errorLabel: 'business document type'
});


// GET /api/v1/businesses - List businesses (Public)
router.get('/', businessController.getBusinesses);

// POST /api/v1/businesses - Register a new business
router.post('/', protect, mutationLimiter, validateRequest(createBusinessSchema), idempotencyMiddleware, businessController.registerBusiness);

// POST /api/v1/businesses/upload - Business-domain file upload (images + documents)
// Uses business-specific multer (allows PDF) and reuses the shared uploadFile controller.
// Must be declared before /:id routes to prevent route shadowing.
// single('file') matches the controller's req.file expectation — no controller changes needed.
router.post('/upload', protect, mutationLimiter, businessUpload.single('file'), uploadFile);

// GET /api/v1/businesses/me - Get my businesses (plural)
router.get('/me', protect, businessController.getMyBusinesses);

// DELETE /api/v1/businesses/me - Withdraw pending business application
router.delete('/me', protect, mutationLimiter, businessController.withdrawBusiness);

// GET /api/v1/businesses/me/stats - Get my business stats
router.get('/me/stats', protect, businessController.getMyBusinessStats);

// GET /api/v1/businesses/:id/stats - Get public business stats by ID/slug
router.get('/:id/stats', validateIdOrSlug('id'), businessController.getBusinessStatsById);

// GET /api/v1/businesses/:id - Get business by ID (Public)
router.get('/:id', validateIdOrSlug('id'), extractUser, businessController.getBusinessById);

// PATCH /api/v1/businesses/:id - Update business
router.patch('/:id', validateObjectId, protect, mutationLimiter, validateRequest(updateBusinessSchema), idempotencyMiddleware, businessController.updateBusiness);

// GET /api/v1/businesses/:id/services - Get business services (Public)
router.get('/:id/services', validateIdOrSlug('id'), businessController.getBusinessServices);

// GET /api/v1/businesses/:id/ads - Get business ads (Public)
router.get('/:id/ads', validateIdOrSlug('id'), businessController.getBusinessAds);

// GET /api/v1/businesses/:id/spare-parts - Get business spare part listings (Public)
router.get('/:id/spare-parts', validateIdOrSlug('id'), businessController.getBusinessSpareParts);

export default router;
