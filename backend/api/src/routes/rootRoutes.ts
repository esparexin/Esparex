import express from 'express';
import { setCsrfToken, getCsrfToken } from '../middleware/csrfProtection';
import { healthCheckHandler } from '../utils/health';
import listingRoutes from './listingRoutes';

const router = express.Router();

router.get('/health', healthCheckHandler);
router.get('/csrf-token', setCsrfToken, getCsrfToken);

// Direct mount for listings
router.use('/listings', listingRoutes);

export default router;
