import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { isValidGeoPoint } from "@esparex/shared";

export const validateSmartAlert = (req: Request, res: Response, next: NextFunction) => {
    const { alertName, name, criteria, frequency } = req.body as {
        alertName?: string; name?: string;
        criteria?: Record<string, unknown>; frequency?: unknown;
    };

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
    if (criteria.categoryId && !mongoose.Types.ObjectId.isValid(criteria.categoryId as string)) {
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
    if (criteria.brandId && !mongoose.Types.ObjectId.isValid(criteria.brandId as string)) {
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
    if (criteria.modelId && !mongoose.Types.ObjectId.isValid(criteria.modelId as string)) {
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

        if (criteria.minPrice !== undefined && maxPrice < (criteria.minPrice as number)) {
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
        (req.body as Record<string, unknown>).frequency = normalized;
    }

    // Radius validation (Max 500km to match geoNear index bounds)
    const reqBody = req.body as Record<string, unknown>;
    const { radiusKm } = reqBody;
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
        reqBody.radiusKm = r;
    }

    // Coordinates strict bounds validation — uses isValidGeoPoint() from shared/utils/geoUtils
    // Checks: GeoJSON Point structure, lng[-180..180], lat[-90..90], null-island [0,0] rejection
    const { coordinates } = reqBody;
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
    (req.body as Record<string, unknown>).name = trimmedName;
    (req.body as Record<string, unknown>).alertName = trimmedName;

    next();
};

/**
 * SEARCH PARAMS VALIDATOR
 * 
 * Validates and sanitizes search/filter parameters.
 * Prevents invalid queries from reaching the database.
 */
