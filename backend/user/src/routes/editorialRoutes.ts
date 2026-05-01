import express from 'express';
import * as editorialController from '../controllers/content/editorial.content.controller';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

/**
 * Editorial Domain
 * ---------------------------------------------------------
 * Manages platform editorial content (About, FAQ, Terms).
 * Unified namespace for platform copy.
 * ---------------------------------------------------------
 */

// Public (Read-First)
router.get('/', editorialController.getAllContent);
router.get('/:slug', editorialController.getContentBySlug);

// Admin (Write/Update)
router.put('/:slug', requireAdmin, editorialController.updateContentBySlug);

export default router;
