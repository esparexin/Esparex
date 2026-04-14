import logger from '../../utils/logger';
import { Request, Response } from 'express';
import { logAdminAction } from '../../utils/adminLogger';
import { createInAppNotification } from '../../services/NotificationService';
import { recalculateTrustScore } from '../../services/TrustService';
import {
    sendSuccessResponse,
    sendAdminError
} from './adminBaseController';
import { normalizeBusinessStatus } from '../../utils/businessStatus';
import { normalizeLocation } from '../../services/location/LocationNormalizer';
import { serializeBusinessForAdmin } from '../business/shared';
import * as businessService from '../../services/BusinessService';
import { buildBusinessLocationPayload } from '../../services/BusinessService';
import * as adminBusinessService from '../../services/AdminBusinessService';
import { mutateStatus } from '../../services/StatusMutationService';
import { BUSINESS_STATUS } from '../../../../shared/enums/businessStatus';
import { ACTOR_TYPE } from '../../../../shared/enums/actor';



export const getBusinessOverview = async (req: Request, res: Response) => {
    try {
        const overview = await adminBusinessService.getBusinessOverview();
        sendSuccessResponse(res, overview);
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const getBusinessAccounts = async (req: Request, res: Response) => {
    const { status } = req.query;
    const city = typeof req.query.city === 'string' ? req.query.city.trim() : '';
    return adminBusinessService.getAdminBusinessAccountsPaginated(req, res, status as string, city);
};

export const getBusinessAccountById = async (req: Request, res: Response) => {
    try {
        const business = await adminBusinessService.getAdminBusinessById(req.params.id as string);
        if (!business) {
            return sendAdminError(req, res, 'Business not found', 404);
        }
        sendSuccessResponse(res, serializeBusinessForAdmin(business));
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const approveBusinessAccount = async (req: Request, res: Response) => {
    try {
        const business = await businessService.approveBusiness(req.params.id as string, (req.user as any)?.id || (req.user as any)?._id);

        if (!business) {
            return sendAdminError(req, res, 'Business not found', 404);
        }

        const expiresAt = (business as any).expiresAt;
        await logAdminAction(req, 'APPROVE_BUSINESS', 'Business', req.params.id, { expiresAt });

        // Trigger Notification
        await createInAppNotification(
            business.userId.toString(),
            'BUSINESS_STATUS',
            'Business Profile Approved! 🏢',
            `Congratulations! Your business "${business.name}" has been approved. You can now post ads as a business.`,
            { businessId: business._id.toString(), status: BUSINESS_STATUS.LIVE }
        );

        // 🏆 TRUST SCORE: Recalculate on business approval
        setImmediate(() => recalculateTrustScore(business.userId).catch(() => { }));

        sendSuccessResponse(res, serializeBusinessForAdmin(business), 'Business approved successfully');
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const rejectBusinessAccount = async (req: Request, res: Response) => {
    try {
        const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
        if (!reason) {
            return sendAdminError(req, res, 'Rejection reason is required', 400);
        }
        const business = await businessService.rejectBusiness(
            req.params.id as string, 
            reason, 
            (req.user as any)?.id || (req.user as any)?._id
        );

        if (!business) {
            return sendAdminError(req, res, 'Business not found', 404);
        }

        await logAdminAction(req, 'REJECT_BUSINESS', 'Business', req.params.id, { reason });

        // Trigger Notification
        await createInAppNotification(
            business.userId.toString(),
            'BUSINESS_STATUS',
            'Business Profile Rejected ⚠️',
            `Your business application for "${business.name}" was not approved. Reason: ${reason || 'Incomplete documentation'}.`,
            { businessId: business._id.toString(), status: BUSINESS_STATUS.REJECTED, reason }
        );

        const actor: any = { type: ACTOR_TYPE.ADMIN, id: (req.user as any)?.id || (req.user as any)?._id };
        const cascaded = await adminBusinessService.cascadeExpireBusinessListings(business._id, actor, `Cascaded from business rejection: ${reason}`);
        if (cascaded > 0) logger.info(`Business Cascade: Expired ${cascaded} listings for business ${business._id}`);

        sendSuccessResponse(res, serializeBusinessForAdmin(business), 'Business rejected');
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const updateBusinessStatus = async (req: Request, res: Response) => {
    try {
        const rawStatus = typeof req.body?.status === 'string' ? req.body.status.trim() : '';
        const status = normalizeBusinessStatus(rawStatus);
        const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';

        if (status === BUSINESS_STATUS.LIVE) {
            return approveBusinessAccount(req, res);
        }

        if (status === BUSINESS_STATUS.REJECTED) {
            if (!reason) req.body.reason = 'Rejected by admin';
            return rejectBusinessAccount(req, res);
        }

        if (status === BUSINESS_STATUS.SUSPENDED) {
            const business = await mutateStatus({
                domain: 'business',
                entityId: req.params.id as string,
                toStatus: BUSINESS_STATUS.SUSPENDED,
                actor: { type: ACTOR_TYPE.ADMIN, id: (req.user as any)?.id || (req.user as any)?._id },
                reason: reason || 'Suspended by admin',
                patch: {
                    rejectionReason: reason || 'Suspended by admin'
                }
            });

            if (!business) {
                return sendAdminError(req, res, 'Business not found', 404);
            }

            await logAdminAction(req, 'SUSPEND_BUSINESS', 'Business', req.params.id, {
                reason: reason || 'Suspended by admin'
            });
            sendSuccessResponse(res, serializeBusinessForAdmin(business), 'Business suspended successfully');
            return;
        }

        return sendAdminError(req, res, `Invalid status. Allowed: ${BUSINESS_STATUS.LIVE}, ${BUSINESS_STATUS.REJECTED}, ${BUSINESS_STATUS.SUSPENDED}`, 400);
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

/**
 * Admin soft-delete a business.
 * Cascades to expire all services and parts, resets user status.
 */
/**
 * Admin edit business fields (name, description, contact, location, etc.)
 * Status is NOT changed by this endpoint; use approve/reject/status for that.
 */
export const updateBusinessByAdmin = async (req: Request, res: Response) => {
    try {
        const allowedFields = [
            'name', 'description', 'mobile', 'phone', 'email', 'website',
            'gstNumber', 'registrationNumber', 'location', 'businessTypes',
        ];
        const patch: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                patch[field] = req.body[field];
            }
        }
        if (typeof patch.phone === 'string' && typeof patch.mobile !== 'string') {
            patch.mobile = patch.phone;
        }
        delete patch.phone;
        if (Object.keys(patch).length === 0) {
            return sendAdminError(req, res, 'No valid fields provided for update', 400);
        }

        const existingBusiness = await adminBusinessService.findBusinessForAdmin(req.params.id as string);
        if (!existingBusiness) {
            return sendAdminError(req, res, 'Business not found', 404);
        }

        if (patch.location && typeof patch.location === 'object' && !Array.isArray(patch.location)) {
            const incomingLocation = patch.location as Record<string, unknown>;
            const currentLocation = (existingBusiness as any).location;
            const normalizedLocation = await normalizeLocation({
                locationId: incomingLocation.locationId || (existingBusiness as any).locationId,
                city: incomingLocation.city || currentLocation?.city,
                state: incomingLocation.state || currentLocation?.state,
                country: incomingLocation.country || currentLocation?.country || 'India',
                display: incomingLocation.display || incomingLocation.address,
                coordinates: incomingLocation.coordinates,
                address: incomingLocation.address,
                pincode: incomingLocation.pincode || currentLocation?.pincode,
            });
            const resolvedLocationPayload = buildBusinessLocationPayload({
                currentLocation,
                incomingLocation,
                normalizedLocation,
                fallbackLocationId: (existingBusiness as any).locationId,
            });

            patch.location = resolvedLocationPayload.location;
            if (resolvedLocationPayload.locationId) {
                patch.locationId = resolvedLocationPayload.locationId;
            }
        }

        const business = await adminBusinessService.updateAdminBusiness(req.params.id as string, patch);
        if (!business) {
            return sendAdminError(req, res, 'Business not found', 404);
        }
        await logAdminAction(req, 'UPDATE_BUSINESS', 'Business', req.params.id, { patch });
        sendSuccessResponse(res, serializeBusinessForAdmin(business), 'Business updated successfully');
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const deleteBusinessAccount = async (req: Request, res: Response) => {
    try {
        const business = await adminBusinessService.findBusinessForAdmin(req.params.id as string);
        if (!business) {
            return sendAdminError(req, res, 'Business not found', 404);
        }

        const businessName = (business as any).name;
        const userId = (business as any).userId.toString();

        // Cascade: use shared helper
        const actor: any = { type: ACTOR_TYPE.ADMIN, id: (req.user as any)?.id || (req.user as any)?._id };
        const cascadedCount = await adminBusinessService.cascadeExpireBusinessListings(business._id, actor, 'Cascaded from business deletion');


        // Soft delete the business
        const deleted = await businessService.softDeleteBusiness(req.params.id as string);

        if (!deleted) {
            return sendAdminError(req, res, 'Business not found', 404);
        }

        await logAdminAction(req, 'DELETE_BUSINESS', 'Business', req.params.id, {
            businessName,
            cascadedListings: cascadedCount
        });

        // Notify the user
        await createInAppNotification(
            userId,
            'BUSINESS_STATUS',
            'Business Account Removed',
            `Your business "${businessName}" has been removed by an administrator.`,
            { businessId: req.params.id, status: BUSINESS_STATUS.DELETED }
        );

        sendSuccessResponse(res, { deleted: true }, 'Business deleted successfully');
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};
