import express from 'express';
import * as editorialController from '@core/controllers/content/editorial.content.controller';

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

export default router;
