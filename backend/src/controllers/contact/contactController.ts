import logger from '../../utils/logger';
import { Request, Response } from 'express';
import ContactSubmission from '../../models/ContactSubmission';
import { sendErrorResponse } from '../../utils/errorResponse';
import { respond } from '../../utils/respond';

/**
 * CONTACT US CONTROLLER
 * 
 * Handles contact form submissions with full backend validation.
 * Rate-limited to prevent spam (configured in routes).
 */

export const submitContactForm = async (req: Request, res: Response) => {
    try {
        const { name, email, mobile, phone, subject, category, message } = req.body;

        // Create contact submission
        const submission = await ContactSubmission.create({
            name,
            email,
            mobile: mobile || phone,
            subject,
            category,
            message,
            status: 'new'
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
