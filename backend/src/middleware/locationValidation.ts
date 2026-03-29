import { NextFunction, Request, Response } from 'express';
import { sendErrorResponse } from '../utils/errorResponse';
import {
    LOCATION_EVENT_REASONS,
    LOCATION_EVENT_SOURCES,
} from '../constants/locationEvents';

const allowedSources = new Set<string>(LOCATION_EVENT_SOURCES);
const allowedReasons = new Set<string>(LOCATION_EVENT_REASONS);
const allowedEventTypes = new Set<string>(['location_search', 'ad_view', 'ad_post']);

export const validateLocationEventRequest = (req: Request, res: Response, next: NextFunction) => {
    const body = (req.body || {}) as Record<string, unknown>;

    const source = typeof body.source === 'string' ? body.source.trim() : '';
    const city = typeof body.city === 'string' ? body.city.trim() : '';
    const state = typeof body.state === 'string' ? body.state.trim() : '';
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    const eventType = typeof body.eventType === 'string' ? body.eventType.trim() : '';
    const locationId = typeof body.locationId === 'string' ? body.locationId.trim() : '';

    if (!allowedSources.has(source)) {
        sendErrorResponse(req, res, 400, 'Invalid location event source');
        return;
    }

    if (!city || !state) {
        sendErrorResponse(req, res, 400, 'Location event requires city and state');
        return;
    }

    if (!allowedReasons.has(reason)) {
        sendErrorResponse(req, res, 400, 'Invalid location event reason');
        return;
    }

    if (eventType && !allowedEventTypes.has(eventType)) {
        sendErrorResponse(req, res, 400, 'Invalid location analytics event type');
        return;
    }

    req.body = {
        ...body,
        source,
        city,
        state,
        reason,
        ...(eventType ? { eventType } : {}),
        ...(locationId ? { locationId } : {}),
    };

    next();
};
