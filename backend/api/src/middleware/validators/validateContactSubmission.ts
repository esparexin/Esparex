import { Request, Response, NextFunction } from 'express';
import { DANGEROUS_HTML_PATTERNS, SQL_INJECTION_PATTERNS } from "@esparex/shared";
import { z } from 'zod';
export const validateContactSubmission = (req: Request, res: Response, next: NextFunction) => {
    const { name, email, mobile, phone, subject, category, message } = req.body as {
        name?: string; email?: string; mobile?: string; phone?: string;
        subject?: string; category?: string; message?: string;
    };

    // Name validation
    if (!name || typeof name !== 'string') {
        res.status(400).json({
            success: false,
            error: 'Name is required',
            status: 400
        });
        return;
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
        res.status(400).json({
            success: false,
            error: 'Name must be between 2 and 100 characters',
            status: 400
        });
        return;
    }

    // Email validation — uses z.string().email() to align with commonSchemas.email behavior
    if (!email || typeof email !== 'string') {
        res.status(400).json({
            success: false,
            error: 'Email is required',
            status: 400
        });
        return;
    }

    const emailParseResult = z.string().email('Invalid email format').safeParse(email.trim());
    if (!emailParseResult.success) {
        res.status(400).json({
            success: false,
            error: 'Invalid email format',
            status: 400
        });
        return;
    }

    if (phone !== undefined) {
        res.status(400).json({
            success: false,
            error: '`phone` is no longer accepted in contact submissions. Use `mobile` instead.',
            status: 400
        });
        return;
    }

    // Mobile validation (optional, but must be valid if provided)
    if (mobile) {
        if (typeof mobile !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Mobile must be a string',
                status: 400
            });
            return;
        }

        const mobileDigits = mobile.replace(/\D/g, '');
        if (mobileDigits.length !== 10) {
            res.status(400).json({
                success: false,
                error: 'Mobile must be exactly 10 digits',
                status: 400
            });
            return;
        }
    }

    // Subject validation (optional)
    if (subject) {
        if (typeof subject !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Subject must be a string',
                status: 400
            });
            return;
        }

        if (subject.trim().length > 200) {
            res.status(400).json({
                success: false,
                error: 'Subject must not exceed 200 characters',
                status: 400
            });
            return;
        }
    }

    // Category validation (optional, but must be valid enum if provided)
    const validCategories = ['general', 'support', 'business', 'technical', 'billing', 'report', 'feedback', 'other'];
    if (category) {
        if (typeof category !== 'string' || !validCategories.includes(category.toLowerCase())) {
            res.status(400).json({
                success: false,
                error: `Category must be one of: ${validCategories.join(', ')}`,
                status: 400
            });
            return;
        }
    }

    // Message validation
    if (!message || typeof message !== 'string') {
        res.status(400).json({
            success: false,
            error: 'Message is required',
            status: 400
        });
        return;
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 20 || trimmedMessage.length > 1000) {
        res.status(400).json({
            success: false,
            error: 'Message must be between 20 and 1000 characters',
            status: 400
        });
        return;
    }

    const fieldsToCheck = [trimmedName, email, subject || '', trimmedMessage];

    for (const field of fieldsToCheck) {
        if (DANGEROUS_HTML_PATTERNS.test(field)) {
            res.status(400).json({
                success: false,
                error: 'Invalid characters detected. HTML and scripts are not allowed.',
                status: 400
            });
            return;
        }
    }

    // Security: Check for SQL injection patterns
    for (const field of fieldsToCheck) {
        if (SQL_INJECTION_PATTERNS.test(field)) {
            res.status(400).json({
                success: false,
                error: 'Invalid content detected',
                status: 400
            });
            return;
        }
    }

    // Sanitize and trim all fields
    const sanitized = req.body as Record<string, unknown>;
    sanitized.name = trimmedName;
    sanitized.email = email.trim().toLowerCase();
    sanitized.mobile = mobile ? mobile.replace(/\D/g, '') : undefined;
    delete sanitized.phone;
    sanitized.subject = subject ? subject.trim() : undefined;
    sanitized.category = category ? category.toLowerCase() : undefined;
    sanitized.message = trimmedMessage;

    next();
};

/**
 * SMART ALERT VALIDATOR
 * 
 * Validates smart alert creation fields.
 * Enforces data types, ranges, and business rules.
 */
