import type { Request, Response } from 'express';
import {
    sendSuccessResponse,
    sendAdminError
} from '@esparex/core/utils/adminBaseController';
import * as adminListingsService from '@esparex/core/services/AdminListingsService';
import type { AdminLogFn } from '@esparex/core/services/AdminListingsService';
import {
    serializeLegacyCountsAdapter,
    serializeLifecycleActionResponse,
    serializeListingCountsResponse,
    serializeModerationDetailResponse,
    serializeModerationListResponse,
} from './listingModerationSerializer';
import { logAdminActionDirect } from '@esparex/core/utils/adminLogger';
import type { IAuthUser } from '@esparex/core/types/auth';

/**
 * Builds the AdminLogFn callback for this request.
 * The service calls this to write audit logs without needing req.
 */
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

const sendLifecycleResponse = (
    res: Response,
    action: 'approved' | 'rejected' | 'deactivated' | 'expired' | 'extended' | 'deleted' | 'report_resolved',
    listing: unknown,
    message: string
) => {
    sendSuccessResponse(res, serializeLifecycleActionResponse({ action, listing, message }));
};

// ---------------------------------------------------------
// Controllers
// ---------------------------------------------------------

export const adminListListings = async (req: Request, res: Response) => {
    try {
        const result = await adminListingsService.adminListListings(req.query);
        return sendSuccessResponse(res, serializeModerationListResponse(result));
    } catch (error) {
        return sendAdminError(req, res, error);
    }
};

export const adminGetListingById = async (req: Request, res: Response) => {
    try {
        const listing = await adminListingsService.adminGetListingById(req.params.id as string);
        return sendSuccessResponse(res, serializeModerationDetailResponse(listing));
    } catch (error) {
        return sendAdminError(req, res, error);
    }
};

export const adminCreateListing = async (req: Request, res: Response) => {
    try {
        const ad = await adminListingsService.adminCreateListing(
            getActorId(req),
            req.body as Record<string, unknown>,
            buildLogFn(req)
        );
        return sendSuccessResponse(res, ad, 'Listing created successfully', 201);
    } catch (err: unknown) {
        return sendAdminError(req, res, err);
    }
};

export const adminUpdateListing = async (req: Request, res: Response) => {
    try {
        const updatedAd = await adminListingsService.adminUpdateListing(
            req.params.id as string,
            getActorId(req),
            req.body as Record<string, unknown>,
            buildLogFn(req)
        );
        return sendSuccessResponse(res, updatedAd, 'Listing updated successfully');
    } catch (err: unknown) {
        return sendAdminError(req, res, err);
    }
};

export const adminApproveListing = async (req: Request, res: Response) => {
    try {
        const reviewVersion = typeof (req.body as Record<string, unknown>)?.reviewVersion === 'number'
            ? (req.body as Record<string, unknown>).reviewVersion as number
            : undefined;
        const updated = await adminListingsService.adminApproveListing(
            req.params.id as string,
            getActorId(req),
            buildLogFn(req),
            reviewVersion
        );
        sendLifecycleResponse(res, 'approved', updated, 'Listing approved successfully');
    } catch (error: unknown) {
        return sendAdminError(req, res, error);
    }
};

export const adminRejectListing = async (req: Request, res: Response) => {
    try {
        const body = req.body as { rejectionReason?: string; reason?: string };
        const rejectionReason = (body.rejectionReason ?? body.reason ?? '').trim();
        const updated = await adminListingsService.adminRejectListing(
            req.params.id as string,
            getActorId(req),
            rejectionReason,
            buildLogFn(req)
        );
        sendLifecycleResponse(res, 'rejected', updated, 'Listing rejected successfully');
    } catch (error: unknown) {
        return sendAdminError(req, res, error);
    }
};

export const adminDeactivateListing = async (req: Request, res: Response) => {
    try {
        const { action, listing, message } = await adminListingsService.adminDeactivateListing(
            req.params.id as string,
            getActorId(req),
            buildLogFn(req)
        );
        sendLifecycleResponse(res, action as 'deactivated', listing, message);
    } catch (error: unknown) {
        return sendAdminError(req, res, error);
    }
};

export const adminExpireListing = async (req: Request, res: Response) => {
    try {
        const updated = await adminListingsService.adminExpireListing(
            req.params.id as string,
            getActorId(req),
            buildLogFn(req)
        );
        sendLifecycleResponse(res, 'expired', updated, 'Listing expired successfully');
    } catch (error: unknown) {
        return sendAdminError(req, res, error);
    }
};

export const adminExtendListing = async (req: Request, res: Response) => {
    try {
        const updated = await adminListingsService.adminExtendListing(
            req.params.id as string,
            getActorId(req),
            buildLogFn(req)
        );
        sendLifecycleResponse(res, 'extended', updated, 'Listing expiry extended successfully');
    } catch (error: unknown) {
        return sendAdminError(req, res, error);
    }
};

export const adminSoftDeleteListing = async (req: Request, res: Response) => {
    try {
        const body = req.body as { hardDelete?: boolean } | undefined;
        const { action, listing, message } = await adminListingsService.adminSoftDeleteListing(
            req.params.id as string,
            getActorId(req),
            buildLogFn(req),
            body?.hardDelete
        );
        sendLifecycleResponse(res, action as 'deleted', listing, message);
    } catch (error: unknown) {
        return sendAdminError(req, res, error);
    }
};

export const adminResolveListingReport = async (req: Request, res: Response) => {
    try {
        const body = req.body as { action?: string; note?: string } | undefined;
        const listingResult = await adminListingsService.adminResolveListingReport(
            req.params.id as string,
            getActorId(req),
            body?.action ?? 'dismiss',
            body?.note,
            buildLogFn(req)
        );
        return sendSuccessResponse(res, listingResult, 'Reports resolved successfully');
    } catch (error: unknown) {
        return sendAdminError(req, res, error);
    }
};

export const adminGetListingCounts = async (req: Request, res: Response) => {
    try {
        const counts = await adminListingsService.adminGetListingCounts(req.query.listingType);
        sendSuccessResponse(res, serializeListingCountsResponse(counts));
    } catch (error) {
        sendAdminError(req, res, error, 500);
    }
};

export const adminGetListingCountsLegacyAdapter = async (req: Request, res: Response) => {
    try {
        const counts = await adminListingsService.adminGetListingCounts(req.query.listingType);
        sendSuccessResponse(res, serializeLegacyCountsAdapter(counts));
    } catch (error) {
        sendAdminError(req, res, error, 500);
    }
};
