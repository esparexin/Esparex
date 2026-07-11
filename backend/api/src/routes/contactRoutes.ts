import express from 'express';
import * as contactController from '../controllers/contact';
import { validateContactSubmission } from '../middleware/securityValidators';
import { contactFormLimiter } from '../middleware/rateLimiter';

const router = express.Router();

/**
 * POST /api/v1/contacts
 *
 * Public endpoint for contact form submissions.
 *
 * Security:
 * - Rate limited: 3 submissions per hour per IP (contactFormLimiter)
 * - Full backend validation via validateContactSubmission
 * - Zod schema DTO extraction in controller (second defense layer)
 * - Input sanitization, XSS/SQL injection prevention
 */
router.post(
    '/',
    contactFormLimiter,
    validateContactSubmission,
    contactController.submitContactForm
);

export default router;

