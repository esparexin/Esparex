import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { sendErrorResponse } from "../../utils/errorResponse";
import { stripMongoOperators } from '@esparex/core/utils/mongoQueryValidator';

export const validateSearchParams = (req: Request, res: Response, next: NextFunction) => {
    req.query = stripMongoOperators(req.query) as Record<string, string | string[] | undefined>;
    const { q, search, category, categoryId, minPrice, maxPrice, sort, location, locationId, level } = req.query;
    const reject = (message: string) => sendErrorResponse(req, res, 400, message);

    if (search !== undefined) {
        return reject('`search` is no longer accepted. Use `q` instead.');
    }

    if (category !== undefined) {
        return reject('`category` is no longer accepted. Use `categoryId` instead.');
    }

    if (location !== undefined) {
        return reject('`location` is no longer accepted. Use `locationId` or lat/lng/radiusKm instead.');
    }

    // Search query validation
    if (q) {
        if (typeof q !== 'string') {
            return reject('Search query must be a string');
        }

        if (q.length > 100) {
            return reject('Search query must not exceed 100 characters');
        }

        // Sanitize search query
        req.query.q = q.trim();
    }

    if (categoryId !== undefined) {
        if (typeof categoryId !== 'string') {
            return reject('categoryId must be a string');
        }
        const normalizedCategoryId = categoryId.trim();
        if (!mongoose.Types.ObjectId.isValid(normalizedCategoryId)) {
            return reject('categoryId must be a valid ObjectId');
        }
        req.query.categoryId = normalizedCategoryId;
    }

    if (locationId !== undefined) {
        if (typeof locationId !== 'string') {
            return reject('locationId must be a string');
        }
        const normalizedLocationId = locationId.trim();
        if (!mongoose.Types.ObjectId.isValid(normalizedLocationId)) {
            return reject('locationId must be a valid ObjectId');
        }
        req.query.locationId = normalizedLocationId;
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
