import { createContactSubmission } from '@esparex/core/services';

import logger from '@esparex/core/utils/logger';
import { z } from 'zod';
import { Request, Response } from 'express';

import { sendErrorResponse } from "@esparex/core/utils/errorResponse";
import { respond } from "@esparex/core/utils/respond";

/**
 * CONTACT US CONTROLLER
 *
 * Handles contact form submissions with full backend validation.
 * Rate-limited to prevent spam (configured in routes).
 * validateContactSubmission middleware runs upstream and normalises req.body.
 * This schema provides a second-layer typed extraction — never trust raw casts.
 */
const contactBodySchema = z.object({
    name:     z.string().min(2).max(100),
    email:    z.string().email(),
    mobile:   z.string().optional(),
    subject:  z.string().max(200).optional(),
    category: z.string().optional(),
    message:  z.string().min(20).max(1000),
});

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

    } catch (error: unknown) {
        logger.error('Contact submission error:', error);
        sendErrorResponse(req, res, 500, 'Failed to submit contact form. Please try again later.');
    }
};

