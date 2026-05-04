import { Request, Response } from 'express';
import {
    sendPaginatedResponse,
    sendSuccessResponse,
    sendAdminError as sendBaseAdminError
} from '@esparex/core/utils/adminBaseController';
import * as adminLocationService from '@esparex/core/services/AdminLocationService';
import { logAdminActionDirect } from '@esparex/core/utils/adminLogger';
import type { AdminLogFn } from '@esparex/core/services/AdminListingsService';
import type { IAuthUser } from '@esparex/core/types/auth';

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

const getActorId = (req: Request): string =>
    (req.user as IAuthUser)?._id?.toString() ?? (req.user as IAuthUser)?.id ?? '';

const getIp = (req: Request): string =>
    (((req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '').split(',')[0] ?? '').trim();

const getUserAgent = (req: Request): string =>
    (req.headers['user-agent'] as string) || '';

const buildLogFn = (req: Request): AdminLogFn =>
    (action, targetType, targetId, metadata) =>
        logAdminActionDirect(
            getActorId(req),
            action,
            targetType,
            targetId,
            metadata,
            getIp(req),
            getUserAgent(req)
        );

// ---------------------------------------------------------
// Controllers
// ---------------------------------------------------------

export const createStateLocation = async (req: Request, res: Response) => {
    try {
        const location = await adminLocationService.adminCreateStateLocation(
            req.body as Record<string, unknown>
        );
        return sendSuccessResponse(res, location);
    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};

export const createCityLocation = async (req: Request, res: Response) => {
    try {
        const location = await adminLocationService.adminCreateCityLocation(
            req.body as Record<string, unknown>
        );
        return sendSuccessResponse(res, location);
    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};

export const createAreaLocation = async (req: Request, res: Response) => {
    try {
        const location = await adminLocationService.adminCreateAreaLocation(
            req.body as Record<string, unknown>
        );
        return sendSuccessResponse(res, location);
    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};

export const getDistinctStates = async (req: Request, res: Response) => {
    try {
        const states = await adminLocationService.adminGetDistinctStates();
        return sendSuccessResponse(res, states);
    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};

export const reverseGeocode = async (req: Request, res: Response) => {
    try {
        const match = await adminLocationService.adminReverseGeocode(
            req.query.lat as string,
            req.query.lng as string
        );
        sendSuccessResponse(res, match);
    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};

export const getAllLocations = async (req: Request, res: Response) => {
    try {
        const { items, total, page, limit } = await adminLocationService.adminGetAllLocations(req.query);
        return sendPaginatedResponse(res, items, total, page, limit);
    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};

export const createLocation = async (req: Request, res: Response) => {
    try {
        const location = await adminLocationService.adminCreateLocation(
            req.body as Record<string, unknown>
        );
        return sendSuccessResponse(res, location);
    } catch (error: unknown) {
        const code = typeof error === 'object' && error !== null ? (error as { code?: unknown }).code : undefined;
        if (code === 11000) {
            return sendBaseAdminError(req, res, 'Duplicate location detected.', 400);
        }
        return sendBaseAdminError(req, res, error);
    }
};

export const updateLocation = async (req: Request, res: Response) => {
    try {
        const location = await adminLocationService.adminUpdateLocation(
            req.params.id as string,
            req.body as Record<string, unknown>
        );
        return sendSuccessResponse(res, location);
    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};

export const toggleLocationStatus = async (req: Request, res: Response) => {
    try {
        const location = await adminLocationService.adminToggleLocationStatus(req.params.id as string);
        return sendSuccessResponse(res, location);
    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};

export const deleteLocation = async (req: Request, res: Response) => {
    try {
        await adminLocationService.adminDeleteLocation(req.params.id as string, buildLogFn(req));
        return sendSuccessResponse(res, null, 'Location deleted successfully');
    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};

export const getGeofences = async (req: Request, res: Response) => {
    try {
        const geofences = await adminLocationService.adminGetGeofences();
        return sendSuccessResponse(res, geofences);
    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};

export const createGeofence = async (req: Request, res: Response) => {
    try {
        const geofence = await adminLocationService.adminCreateGeofence(
            req.body as Record<string, unknown>,
            buildLogFn(req)
        );
        return sendSuccessResponse(res, geofence);
    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};

export const updateGeofence = async (req: Request, res: Response) => {
    try {
        const geofence = await adminLocationService.adminUpdateGeofence(
            req.params.id as string,
            req.body as Record<string, unknown>,
            buildLogFn(req)
        );
        return sendSuccessResponse(res, geofence);
    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};

export const deleteGeofence = async (req: Request, res: Response) => {
    try {
        await adminLocationService.adminDeleteGeofence(req.params.id as string, buildLogFn(req));
        return sendSuccessResponse(res, null, 'Geofence deleted');
    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};

export const getModerationQueue = async (req: Request, res: Response) => {
    try {
        const { locations, total, page, limit } = await adminLocationService.adminGetModerationQueue(req.query);
        return sendPaginatedResponse(res, locations, total, page, limit);
    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};

export const approveRejectLocation = async (req: Request, res: Response) => {
    try {
        const body = req.body as { status?: 'verified' | 'rejected'; reason?: string };
        const location = await adminLocationService.adminApproveRejectLocation(
            req.params.id as string,
            body.status as 'verified' | 'rejected',
            body.reason,
            buildLogFn(req)
        );
        return sendSuccessResponse(res, location);
    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};

export const refreshLocationStats = async (req: Request, res: Response) => {
    try {
        await adminLocationService.adminRefreshLocationStats(buildLogFn(req));
        return sendSuccessResponse(res, null, 'Location statistics update queued successfully');
    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};
