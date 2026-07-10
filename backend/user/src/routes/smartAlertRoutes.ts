import express from 'express';
import * as smartAlertController from '../controllers/smartAlert';
import { protect } from '../middleware/authMiddleware';
import { mutationLimiter } from '../middleware/rateLimiter';
import { validateObjectId } from '../middleware/validateObjectId';
import { validateRequest } from '../middleware/validateRequest';
import { SmartAlertCreateSchema, SmartAlertUpdateSchema, SavedSearchCreateSchema } from "@shared";
import { deprecateMethod } from '../middleware/deprecations';
import type { ZodTypeAny } from 'zod';

const router = express.Router();

// GET /api/v1/smart-alerts
router.get('/', protect, smartAlertController.getSmartAlerts);

// POST /api/v1/smart-alerts
// Rate limited + validated to prevent abuse
router.post(
    '/',
    protect,
    mutationLimiter,
    validateRequest(SmartAlertCreateSchema as unknown as ZodTypeAny),
    smartAlertController.createSmartAlert
);

// GET /api/v1/smart-alerts/saved-searches
router.get('/saved-searches', protect, smartAlertController.listSavedSearches);

// POST /api/v1/smart-alerts/saved-searches
router.post(
    '/saved-searches',
    protect,
    mutationLimiter,
    validateRequest(SavedSearchCreateSchema as unknown as ZodTypeAny),
    smartAlertController.createSavedSearchEntry
);

// DELETE /api/v1/smart-alerts/saved-searches/:id
router.delete(
    '/saved-searches/:id',
    protect,
    validateObjectId,
    smartAlertController.deleteSavedSearchEntry
);

// PATCH /api/v1/smart-alerts/:id
// NEW: Update existing smart alert (Standardized)
router.patch(
    '/:id',
    protect,
    mutationLimiter,
    validateObjectId,
    validateRequest(SmartAlertUpdateSchema as unknown as ZodTypeAny),
    smartAlertController.updateSmartAlert
);

// PUT /api/v1/smart-alerts/:id
// DEPRECATED: Use PATCH instead. Update existing smart alert
router.put(
    '/:id',
    deprecateMethod('PATCH'),
    protect,
    mutationLimiter,
    validateObjectId,
    validateRequest(SmartAlertUpdateSchema as unknown as ZodTypeAny),
    smartAlertController.updateSmartAlert
);

// PATCH /api/v1/smart-alerts/:id/toggle-status
router.patch(
    '/:id/toggle-status',
    protect,
    validateObjectId,
    mutationLimiter,
    smartAlertController.toggleSmartAlertStatus
);

// DELETE /api/v1/smart-alerts/:id
router.delete('/:id', protect, validateObjectId, smartAlertController.deleteSmartAlert);

export default router;
