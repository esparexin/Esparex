import express from 'express';
import * as importController from '../controllers/content/import.content.controller';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

/**
 * Import Domain
 * ---------------------------------------------------------
 * Handles bulk data ingestion for platform content.
 * ---------------------------------------------------------
 */

// Admin Only
router.post('/bulk', requireAdmin, importController.bulkImport);
router.post('/seed-devices', requireAdmin, importController.seedDevices);

export default router;
