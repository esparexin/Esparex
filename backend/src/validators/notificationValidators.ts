import { Request, Response, NextFunction } from 'express';
import validator from 'validator';

/**
 * Sanitize and validate notification content
 * Prevents XSS attacks and enforces length limits
 */
export const validateNotificationContent = (req: Request, res: Response, next: NextFunction) => {
    const { title, body, data } = req.body;

    // Validate title
    if (title) {
        // Sanitize HTML/script tags
        req.body.title = validator.escape(title.trim());

        // Enforce length limit
        if (req.body.title.length > 100) {
            return res.status(400).json({
                error: 'Title must be 100 characters or less'
            });
        }
    }

    // Validate body/message
    const messageField = body || req.body.message;
    if (messageField) {
        // Sanitize HTML/script tags
        const sanitized = validator.escape(messageField.trim());
        if (body) {
            req.body.body = sanitized;
        } else {
            req.body.message = sanitized;
        }

        // Enforce length limit
        if (sanitized.length > 500) {
            return res.status(400).json({
                error: 'Message must be 500 characters or less'
            });
        }
    }

    // Validate data object
    if (data && typeof data === 'object') {
        // Sanitize string values in data object
        for (const key in data) {
            if (typeof data[key] === 'string') {
                data[key] = validator.escape(data[key]);
            }
        }
    }

    next();
};

/**
 * Validate notification type enum
 */
export const validateNotificationType = (req: Request, res: Response, next: NextFunction) => {
    const { type } = req.body;

    const validTypes = ['SMART_ALERT', 'ORDER_UPDATE', 'AD_STATUS', 'BUSINESS_STATUS', 'SYSTEM', 'PRICE_DROP', 'CHAT'];

    if (type && !validTypes.includes(type)) {
        return res.status(400).json({
            error: `Invalid notification type. Must be one of: ${validTypes.join(', ')}`
        });
    }

    next();
};

/**
 * Validate admin notification target
 */
export const validateAdminNotificationTarget = (req: Request, res: Response, next: NextFunction) => {
    const { targetType, userIds, targetValue } = req.body;

    const validTargetTypes = ['all', 'users', 'topic'];

    if (!targetType || !validTargetTypes.includes(targetType)) {
        return res.status(400).json({
            error: `Invalid targetType. Must be one of: ${validTargetTypes.join(', ')}`
        });
    }

    // Validate userIds for 'users' targetType
    if (targetType === 'users') {
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                error: 'userIds array is required for targetType "users"'
            });
        }

        // Limit max users to prevent abuse
        if (userIds.length > 1000) {
            return res.status(400).json({
                error: 'Cannot send to more than 1000 users at once'
            });
        }
    }

    // Validate targetValue for 'topic' targetType
    if (targetType === 'topic' && !targetValue) {
        return res.status(400).json({
            error: 'targetValue is required for targetType "topic"'
        });
    }

    next();
};
