import logger from '@esparex/core/utils/logger';
import { Request, Response } from 'express';
import { createContactSubmission } from '@esparex/core/domains/communications';
import { contactSubmissionRequestSchema } from '@esparex/contracts';
import { emailService, renderContactInquiryEmail } from '@esparex/core/domains/notifications';
import { sendErrorResponse } from "../../utils/errorResponse";
import { respond } from "../../utils/respond";

/**
 * CONTACT US CONTROLLER
 *
 * Handles contact form submissions with full backend validation.
 * Rate-limited to prevent spam (configured in routes).
 * validateContactSubmission middleware runs upstream and normalises req.body.
 * This schema provides a second-layer typed extraction — never trust raw casts.
 * Request DTO owned by @esparex/contracts (audit E17).
 */
const contactBodySchema = contactSubmissionRequestSchema;

export const submitContactForm = async (req: Request, res: Response) => {
    try {
        const parsed = contactBodySchema.parse(req.body);

        const submission = await createContactSubmission({
            name:     parsed.name,
            email:    parsed.email,
            mobile:   parsed.mobile,
            subject:  parsed.subject,
            category: parsed.category,
            message:  parsed.message,
        });

        res.status(201).json(respond({
            success: true,
            message: 'Your message has been received. We will get back to you soon.',
            data: {
                id: submission._id,
                createdAt: submission.createdAt
            }
        }));

        setImmediate(() => {
            void (async () => {
                try {
                    const inquiryHtml = renderContactInquiryEmail({
                        name: parsed.name,
                        email: parsed.email,
                        mobile: parsed.mobile,
                        subject: parsed.subject || 'Support Request',
                        message: parsed.message,
                    });
                    await emailService.sendEmail(
                        process.env.SUPPORT_EMAIL || 'support@esparex.in',
                        `New Contact Inquiry: ${parsed.subject || 'Support Request'}`,
                        inquiryHtml
                    );
                } catch (err) {
                    logger.warn('Failed to send contact inquiry notification email', {
                        error: err instanceof Error ? err.message : String(err),
                    });
                }
            })();
        });

    } catch (error: unknown) {
        logger.error('Contact submission error:', error);
        sendErrorResponse(req, res, 500, 'Failed to submit contact form. Please try again later.');
    }
};

