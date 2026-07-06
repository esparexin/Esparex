import express from 'express';
import { setCsrfToken, getCsrfToken } from '../middleware/csrfProtection';
import { healthCheckHandler } from '@esparex/core/tooling';;

const router = express.Router();

router.get('/health', healthCheckHandler);
router.get('/csrf-token', setCsrfToken, getCsrfToken);

export default router;
