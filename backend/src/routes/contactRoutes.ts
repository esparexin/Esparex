import express from 'express';
import * as contactController from '../controllers/contact';
import { validateContactSubmission } from '../validators/securityValidators';
import { mutationLimiter } from '../middleware/rateLimiter';

const router = express.Router();

/**
 * POST /api/v1/contacts
 * 
 * Public endpoint for contact form submissions.
 * 
 * Security:
 * - Rate limited: 10 submissions per hour per IP
 * - Full backend validation
 * - Input sanitization
 * - XSS/SQL injection prevention
 */
router.post(
    '/',
    mutationLimiter,
    validateContactSubmission,
    contactController.submitContactForm
);

export default router;
