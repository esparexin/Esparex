import express from 'express';
import { setCsrfToken, getCsrfToken } from '../middleware/csrfProtection';
// import { isDbReady } from '../config/db'; // Unused?
import { healthCheckHandler } from '../utils/health';

const router = express.Router();

router.get('/health', healthCheckHandler);
router.get('/csrf-token', setCsrfToken, getCsrfToken);

export default router;
