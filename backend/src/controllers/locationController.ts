import { Request, Response } from "express";
import { getCache, setCache, CACHE_KEYS, CACHE_TTLS } from "../utils/redisCache";
import logger from "../utils/logger";
import { sendErrorResponse } from '../utils/errorResponse';
import { getSystemConfigDoc } from "../utils/systemConfigHelper";
import { env } from '../config/env';
import { respond } from "../utils/respond";
import LocationEvent from "../models/LocationEvent";
import {
    getDefaultCenterLocation,
    getAreasByCityId,
    getCitiesByStateId,
    getStateLocations,
    ingestLocation as ingestLocationService
} from '../services/location/LocationHierarchyService';
import {
    lookupLocationByPincode as lookupLocationByPincodeService,
    searchLocations as searchLocationsService
} from '../services/location/LocationSearchService';
import {
    touchLocationSearchAnalytics,
    logLocationEvent as logLocationAnalyticsEvent
} from '../services/location/LocationAnalyticsService';
import {
    reverseGeocode as reverseGeocodeService
} from '../services/location/ReverseGeocodeService';
import { formatLocationResponse as formatCanonicalLocationResponse, type LocationResponseLike } from '../lib/location/formatLocation';

/* -------------------------------------------------------------------------- */
/* LOCATION CONFIG & UTILS                                                    */
/* -------------------------------------------------------------------------- */

export type LocationLike = LocationResponseLike;

export type LocationConfig = {
    autoCompleteMinChars: number;
    maxSearchRadius: number;
    enableReverseGeocoding: boolean;
    enableAutoComplete: boolean;
};

export const DEFAULT_LOCATION_CONFIG: LocationConfig = {
    autoCompleteMinChars: 2,
    maxSearchRadius: 100,
    enableReverseGeocoding: true,
    enableAutoComplete: true,
};

const LOCATION_CONFIG_TTL_MS = 60 * 1000;
let cachedLocationConfig: { data: LocationConfig; timestamp: number } | null = null;

export const getLocationConfig = async (): Promise<LocationConfig> => {
    if (cachedLocationConfig && Date.now() - cachedLocationConfig.timestamp < LOCATION_CONFIG_TTL_MS) {
        return cachedLocationConfig.data;
    }

    try {
        const configDoc = await getSystemConfigDoc();
        const rawLocation = (configDoc as { location?: Record<string, unknown> } | null)?.location || {};

        const data: LocationConfig = {
            autoCompleteMinChars: Number(rawLocation.autoCompleteMinChars) || DEFAULT_LOCATION_CONFIG.autoCompleteMinChars,
            maxSearchRadius: Number(rawLocation.maxSearchRadius) || DEFAULT_LOCATION_CONFIG.maxSearchRadius,
            enableReverseGeocoding: typeof rawLocation.enableReverseGeocoding === 'boolean'
                ? rawLocation.enableReverseGeocoding
                : DEFAULT_LOCATION_CONFIG.enableReverseGeocoding,
            enableAutoComplete: typeof rawLocation.enableAutoComplete === 'boolean'
                ? rawLocation.enableAutoComplete
                : DEFAULT_LOCATION_CONFIG.enableAutoComplete
        };

        cachedLocationConfig = { data, timestamp: Date.now() };
        return data;
    } catch {
        return DEFAULT_LOCATION_CONFIG;
    }
};

export const formatLocationResponse = (loc: LocationLike) =>
    formatCanonicalLocationResponse(loc);

/* -------------------------------------------------------------------------- */
/* CONTROLLER METHODS                                                         */
/* -------------------------------------------------------------------------- */

export const searchLocations = async (req: Request, res: Response) => {
    try {
        const config = await getLocationConfig();
        if (!config.enableAutoComplete) {
            return res.json(respond({ success: true, data: [] }));
        }

        const rawQ = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
        const q = typeof rawQ === "string" ? rawQ.trim() : "";
        const minChars = Math.max(1, Math.min(2, config.autoCompleteMinChars || 2));

        if (q.length < minChars) return res.json(respond({ success: true, data: [] }));

        const cacheKey = CACHE_KEYS.searchCity(q.toLowerCase());
        const cached = await getCache(cacheKey);
        if (cached) return res.json(respond({ success: true, data: cached }));

        const response = await searchLocationsService(q);
        const locationIds = response
            .map((item: any) => item.id)
            .filter((value: any): value is string => typeof value === 'string' && value.length > 0);

        void touchLocationSearchAnalytics(locationIds).catch((error: unknown) => {
            logger.warn('Failed to update location analytics', { error: error instanceof Error ? error.message : String(error) });
        });

        if (response.length > 0) {
            await setCache(cacheKey, response, CACHE_TTLS.CITY_SEARCH);
        }
        return res.json(respond({ success: true, data: response }));
    } catch (error: unknown) {
        logger.error('searchLocations error', { error: error instanceof Error ? error.message : String(error) });
        return sendErrorResponse(req, res, 500, "Failed to search locations");
    }
};

export const lookupPincode = async (req: Request, res: Response) => {
    try {
        const rawPincode = Array.isArray(req.params.pincode) ? req.params.pincode[0] : req.params.pincode;
        const pincode = typeof rawPincode === "string" ? rawPincode.trim() : "";

        if (!/^\d{6}$/.test(pincode)) {
            return sendErrorResponse(req, res, 400, "Valid 6-digit pincode is required");
        }

        const cacheKey = `location:pincode:${pincode}`;
        const cached = await getCache(cacheKey);
        if (cached) {
            return res.json(respond({ success: true, data: cached }));
        }

        const location = await lookupLocationByPincodeService(pincode);
        if (!location) {
            return sendErrorResponse(req, res, 404, "Pincode not found");
        }

        await setCache(cacheKey, location, CACHE_TTLS.CITY_SEARCH);
        return res.json(respond({ success: true, data: location }));
    } catch (error: unknown) {
        logger.error("lookupPincode error", { error: error instanceof Error ? error.message : String(error) });
        return sendErrorResponse(req, res, 500, "Failed to resolve pincode");
    }
};

export const getStates = async (req: Request, res: Response) => {
    try {
        const states = await getStateLocations();
        return res.json(respond({ success: true, data: states }));
    } catch (error: unknown) {
        logger.error('getStates error', { error: error instanceof Error ? error.message : String(error) });
        return sendErrorResponse(req, res, 500, 'Failed to fetch states');
    }
};

export const getCities = async (req: Request, res: Response) => {
    try {
        const stateId = Array.isArray(req.query.stateId) ? req.query.stateId[0] : req.query.stateId;
        if (typeof stateId !== 'string' || !stateId.trim()) {
            return sendErrorResponse(req, res, 400, 'stateId is required');
        }

        const cities = await getCitiesByStateId(stateId.trim());
        return res.json(respond({ success: true, data: cities }));
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch cities';
        if (/invalid stateid/i.test(message)) return sendErrorResponse(req, res, 400, 'Invalid stateId');
        logger.error('getCities error', { error: message });
        return sendErrorResponse(req, res, 500, 'Failed to fetch cities');
    }
};

export const getAreas = async (req: Request, res: Response) => {
    try {
        const cityId = Array.isArray(req.query.cityId) ? req.query.cityId[0] : req.query.cityId;
        if (typeof cityId !== 'string' || !cityId.trim()) {
            return sendErrorResponse(req, res, 400, 'cityId is required');
        }

        const areas = await getAreasByCityId(cityId.trim());
        return res.json(respond({ success: true, data: areas }));
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch areas';
        if (/invalid cityid/i.test(message)) return sendErrorResponse(req, res, 400, 'Invalid cityId');
        logger.error('getAreas error', { error: message });
        return sendErrorResponse(req, res, 500, 'Failed to fetch areas');
    }
};

export const ipLocate = async (req: Request, res: Response) => {
    try {
        const apiKey = env.IPAPI_KEY;
        const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
        const url = apiKey ? `https://ipapi.co/${ip}/json/?key=${apiKey}` : `https://ipapi.co/${ip}/json/`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        let data: Record<string, unknown>;
        try {
            const response = await fetch(url, {
                headers: { Accept: 'application/json', 'User-Agent': 'Esparex/1.0' },
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (!response.ok) return res.json(respond({ success: false, data: null }));
            data = await response.json() as Record<string, unknown>;
        } catch {
            clearTimeout(timeout);
            return res.json(respond({ success: false, data: null }));
        }

        if (!data?.city || data.latitude == null || data.longitude == null) {
            return res.json(respond({ success: false, data: null }));
        }

        // ipapi.co returns the state/province as `region` (not `state`)
        if (!data || !data.city || !data.region) {
            return sendErrorResponse(req, res, 422, 'IP geolocation returned incomplete location data');
        }

        const lat = Number(data.latitude);
        const lng = Number(data.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return res.json(respond({ success: false, data: null }));
        }

        return res.json(respond({
            success: true,
            data: {
                city: data.city,
                state: data.region,
                country: data.country_name || 'Unknown',
                coordinates: { type: 'Point', coordinates: [lng, lat] as [number, number] },
            },
        }));
    } catch (error: unknown) {
        logger.error('ipLocate error', { error: error instanceof Error ? error.message : String(error) });
        return res.json(respond({ success: false, data: null }));
    }
};

export const getDefaultCenter = async (req: Request, res: Response) => {
    try {
        const configDoc = await getSystemConfigDoc();
        const rawCenter = (configDoc as any)?.location?.defaultCenter;
        const center = await getDefaultCenterLocation(rawCenter);
        return res.json(respond({ success: true, data: center }));
    } catch (error: unknown) {
        logger.error('getDefaultCenter error', { error: error instanceof Error ? error.message : String(error) });
        return sendErrorResponse(req, res, 500, "Failed to resolve default center");
    }
};

export const logLocationEvent = async (req: Request, res: Response) => {
    try {
        const { source, city, state, lat, lng, reason, eventType, locationId } = req.body;

        // Extract userId if authenticated (optional — events logged for both anon and authed users)
        const userId = (req as any).user?._id ?? (req as any).user?.id ?? undefined;

        if (typeof locationId === 'string' && locationId.length > 0 && typeof eventType === 'string' && eventType.length > 0) {
            try {
                await logLocationAnalyticsEvent({ locationId, eventType });
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                if (/invalid|inactive/i.test(message)) {
                    return sendErrorResponse(req, res, 400, 'Invalid or inactive locationId');
                }
                logger.warn('Failed to write location analytics from log-event', {
                    locationId, eventType, error: message
                });
            }
        }
        await LocationEvent.create({
            source,
            city,
            state,
            coordinates: (lat != null && lng != null) ? { type: 'Point', coordinates: [Number(lng), Number(lat)] } : undefined,
            reason,
            userId,
        });
        return res.json(respond({ success: true }));
    } catch {
        return sendErrorResponse(req, res, 500, "Failed to log location event");
    }
};

export const geocode = async (req: Request, res: Response) => {
    try {
        const config = await getLocationConfig();
        if (!config.enableReverseGeocoding) return res.json(respond({ success: true, data: null }));

        const lat = Number(req.query.lat);
        const lng = Number(req.query.lng);

        if (Number.isNaN(lat) || Number.isNaN(lng)) return sendErrorResponse(req, res, 400, "Invalid coordinates");

        if (lat < -90 || lat > 90) {
            return sendErrorResponse(req, res, 400, 'Latitude must be between -90 and 90');
        }
        if (lng < -180 || lng > 180) {
            return sendErrorResponse(req, res, 400, 'Longitude must be between -180 and 180');
        }

        const best = await reverseGeocodeService(lat, lng);
        return res.json(respond({ success: true, data: best }));
    } catch (error: unknown) {
        logger.error('geocode error', { error: error instanceof Error ? error.message : String(error) });
        const message = error instanceof Error ? error.message : 'Geocode failed';
        const statusCode = /Invalid|range|Null-island/i.test(message) ? 400 : 500;
        return sendErrorResponse(req, res, statusCode, message);
    }
};

export const ingestLocation = async (req: Request, res: Response) => {
    try {
        const ingested = await ingestLocationService(req.body);
        return res.json(respond({ success: true, data: ingested }));
    } catch (error: unknown) {
        logger.error('ingestLocation error', { error: error instanceof Error ? error.message : String(error) });
        const message = error instanceof Error ? error.message : 'Failed to ingest location';
        const statusCode = /Missing required fields|Invalid coordinates/i.test(message) ? 400 : 500;
        return sendErrorResponse(req, res, statusCode, message);
    }
};
