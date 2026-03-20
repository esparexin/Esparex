import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { sendErrorResponse } from '../utils/errorResponse';
import { isValidGeoPoint } from '../../../shared/utils/geoUtils';
import { z } from 'zod';
import { DANGEROUS_HTML_PATTERNS, SQL_INJECTION_PATTERNS } from '../../../shared/utils/securityPatterns';

/**
 * CONTACT US FORM VALIDATOR
 * 
 * Validates all fields for the contact submission endpoint.
 * Prevents spam, injection attacks, and invalid data.
 */
export const validateContactSubmission = (req: Request, res: Response, next: NextFunction) => {
    const { name, email, phone, subject, category, message } = req.body;

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

    // Phone validation (optional, but must be valid if provided)
    if (phone) {
        if (typeof phone !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Phone must be a string',
                status: 400
            });
            return;
        }

        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length !== 10) {
            res.status(400).json({
                success: false,
                error: 'Phone must be exactly 10 digits',
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
    req.body.name = trimmedName;
    req.body.email = email.trim().toLowerCase();
    req.body.phone = phone ? phone.replace(/\D/g, '') : undefined;
    req.body.subject = subject ? subject.trim() : undefined;
    req.body.category = category ? category.toLowerCase() : undefined;
    req.body.message = trimmedMessage;

    next();
};

/**
 * SMART ALERT VALIDATOR
 * 
 * Validates smart alert creation fields.
 * Enforces data types, ranges, and business rules.
 */
export const validateSmartAlert = (req: Request, res: Response, next: NextFunction) => {
    const { alertName, name, criteria, frequency } = req.body;

    const incomingName = typeof name === 'string'
        ? name
        : (typeof alertName === 'string' ? alertName : undefined);

    // Alert name validation
    if (!incomingName) {
        res.status(400).json({
            success: false,
            error: 'Alert name is required',
            status: 400
        });
        return;
    }

    const trimmedName = incomingName.trim();
    if (trimmedName.length < 3 || trimmedName.length > 50) {
        res.status(400).json({
            success: false,
            error: 'Alert name must be between 3 and 50 characters',
            status: 400
        });
        return;
    }

    // Criteria validation
    if (!criteria || typeof criteria !== 'object') {
        res.status(400).json({
            success: false,
            error: 'Alert criteria is required',
            status: 400
        });
        return;
    }

    // Category validation (optional)
    if (criteria.categoryId && !mongoose.Types.ObjectId.isValid(criteria.categoryId)) {
        res.status(400).json({
            success: false,
            error: 'Invalid category ID',
            status: 400
        });
        return;
    }

    if (criteria.category && typeof criteria.category !== 'string') {
        res.status(400).json({
            success: false,
            error: 'Category must be a string',
            status: 400
        });
        return;
    }

    // Brand validation (optional)
    if (criteria.brandId && !mongoose.Types.ObjectId.isValid(criteria.brandId)) {
        res.status(400).json({
            success: false,
            error: 'Invalid brand ID',
            status: 400
        });
        return;
    }

    if (criteria.brand && typeof criteria.brand !== 'string') {
        res.status(400).json({
            success: false,
            error: 'Brand must be a string',
            status: 400
        });
        return;
    }

    // Model validation (optional)
    if (criteria.modelId && !mongoose.Types.ObjectId.isValid(criteria.modelId)) {
        res.status(400).json({
            success: false,
            error: 'Invalid model ID',
            status: 400
        });
        return;
    }

    if (criteria.model && typeof criteria.model !== 'string') {
        res.status(400).json({
            success: false,
            error: 'Model must be a string',
            status: 400
        });
        return;
    }

    // Price validation
    if (criteria.minPrice !== undefined) {
        const minPrice = Number(criteria.minPrice);
        if (isNaN(minPrice) || minPrice < 0) {
            res.status(400).json({
                success: false,
                error: 'Minimum price must be a non-negative number',
                status: 400
            });
            return;
        }
        criteria.minPrice = minPrice;
    }

    if (criteria.maxPrice !== undefined) {
        const maxPrice = Number(criteria.maxPrice);
        if (isNaN(maxPrice) || maxPrice < 0) {
            res.status(400).json({
                success: false,
                error: 'Maximum price must be a non-negative number',
                status: 400
            });
            return;
        }

        if (criteria.minPrice !== undefined && maxPrice < criteria.minPrice) {
            res.status(400).json({
                success: false,
                error: 'Maximum price must be greater than minimum price',
                status: 400
            });
            return;
        }
        criteria.maxPrice = maxPrice;
    }

    if (frequency !== undefined) {
        const normalized = String(frequency).toLowerCase();
        if (!['daily', 'instant'].includes(normalized)) {
            res.status(400).json({
                success: false,
                error: 'Frequency must be daily or instant',
                status: 400
            });
            return;
        }
        req.body.frequency = normalized;
    }

    // Radius validation (Max 500km to match geoNear index bounds)
    const { radiusKm } = req.body;
    if (radiusKm !== undefined) {
        const r = Number(radiusKm);
        if (isNaN(r) || r < 1 || r > 500) {
            res.status(400).json({
                success: false,
                error: 'Radius must be between 1 and 500 kilometers',
                status: 400
            });
            return;
        }
        req.body.radiusKm = r;
    }

    // Coordinates strict bounds validation — uses isValidGeoPoint() from shared/utils/geoUtils
    // Checks: GeoJSON Point structure, lng[-180..180], lat[-90..90], null-island [0,0] rejection
    const { coordinates } = req.body;
    if (coordinates !== undefined) {
        if (!isValidGeoPoint(coordinates)) {
            res.status(400).json({
                success: false,
                error: 'Coordinates must be a valid GeoJSON Point with longitude [-180, 180] and latitude [-90, 90]. Coordinates [0,0] are not allowed.',
                status: 400
            });
            return;
        }
    }

    // Normalize name field for controller
    req.body.name = trimmedName;
    req.body.alertName = trimmedName;

    next();
};

/**
 * SEARCH PARAMS VALIDATOR
 * 
 * Validates and sanitizes search/filter parameters.
 * Prevents invalid queries from reaching the database.
 */
export const validateSearchParams = (req: Request, res: Response, next: NextFunction) => {
    const { search, category, minPrice, maxPrice, sort, location, level } = req.query;
    const reject = (message: string) => sendErrorResponse(req, res, 400, message);

    // Search query validation
    if (search) {
        if (typeof search !== 'string') {
            return reject('Search query must be a string');
        }

        if (search.length > 100) {
            return reject('Search query must not exceed 100 characters');
        }

        // Sanitize search query
        req.query.search = search.trim();
    }

    // Category validation (legacy key support)
    if (category !== undefined) {
        if (typeof category !== 'string') {
            return reject('Category must be a string');
        }
        const normalizedCategory = category.trim();
        if (normalizedCategory.length > 100) {
            return reject('Category must not exceed 100 characters');
        }

        req.query.category = normalizedCategory;
        if (mongoose.Types.ObjectId.isValid(normalizedCategory)) {
            req.query.categoryId = normalizedCategory;
        }
    }

    // Price range validation
    if (minPrice) {
        const min = Number(minPrice);
        if (isNaN(min) || min < 0) {
            return reject('Minimum price must be a non-negative number');
        }
    }

    if (maxPrice) {
        const max = Number(maxPrice);
        if (isNaN(max) || max < 0) {
            return reject('Maximum price must be a non-negative number');
        }

        if (minPrice && max < Number(minPrice)) {
            return reject('Maximum price must be greater than minimum price');
        }
    }

    // Sort validation
    if (sort) {
        const validSorts = ['newest', 'oldest', 'price-low', 'price-high', 'relevance'];
        if (!validSorts.includes(sort as string)) {
            return reject(`Sort must be one of: ${validSorts.join(', ')}`);
        }
    }

    if (level !== undefined) {
        if (typeof level !== 'string') {
            return reject('Level must be a string');
        }
        const normalizedLevel = level.trim().toLowerCase();
        const validLevels = ['country', 'state', 'district', 'city', 'area', 'village'];
        if (!validLevels.includes(normalizedLevel)) {
            return reject(`Level must be one of: ${validLevels.join(', ')}`);
        }
        req.query.level = normalizedLevel;
    }

    // Location validation (Allow both ObjectId and String Names)
    if (location) {
        if (typeof location !== 'string') {
            return reject('Location must be a string');
        }
    }

    // Geo validation
    const { lat, lng, radiusKm } = req.query;
    if (lat) {
        const latitude = Number(lat);
        if (isNaN(latitude) || latitude < -90 || latitude > 90) {
            return reject('Invalid latitude. Must be between -90 and 90.');
        }
    }

    if (lng) {
        const longitude = Number(lng);
        if (isNaN(longitude) || longitude < -180 || longitude > 180) {
            return reject('Invalid longitude. Must be between -180 and 180.');
        }
    }

    if (radiusKm) {
        const radius = Number(radiusKm);
        if (isNaN(radius) || radius < 0 || radius > 500) {
            return reject('Invalid radius. Must be between 0 and 500 kilometers.');
        }
    }

    next();
};
