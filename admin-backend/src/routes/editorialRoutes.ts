import express from 'express';
import * as editorialController from '@core/controllers/content/editorial.content.controller';
import { requireAdmin, requirePermission } from '../middleware/adminAuth';
import { adminMutationLimiter } from '../middleware/rateLimiter';

const router = express.Router();

/**
 * Editorial Management
 * ---------------------------------------------------------
 * Manages platform editorial content (About, FAQ, Terms).
 * ---------------------------------------------------------
 */

// Admin (Write/Update)
router.put('/:slug', requirePermission('content:write'), adminMutationLimiter, editorialController.updateContentBySlug);

export default router;
