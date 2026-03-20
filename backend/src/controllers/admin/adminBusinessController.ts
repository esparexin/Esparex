import logger from '../../utils/logger';
import { Request, Response } from 'express';
import Business from '../../models/Business';
import AdModel from '../../models/Ad';
import { Document, Model } from 'mongoose';
import { logAdminAction } from '../../utils/adminLogger';
import { GOVERNANCE, MS_IN_DAY } from '../../config/constants';
import { createInAppNotification } from '../../services/NotificationService';
import { publishedBusinessStatusQuery } from '../../utils/businessStatus';
import { recalculateTrustScore } from '../../services/TrustService';
import {
    sendSuccessResponse
} from './adminBaseController';
import { sendErrorResponse } from '../../utils/errorResponse';
import { normalizeBusinessStatus } from '../../utils/businessStatus';

import { handlePaginatedContent } from '../../utils/contentHandler';
import * as businessService from '../../services/BusinessService';
import * as adminBusinessService from '../../services/AdminBusinessService';
import AdminMetrics from '../../models/AdminMetrics';
import { mutateStatus, mutateStatuses } from '../../services/StatusMutationService';
import { BUSINESS_STATUS } from '../../../../shared/enums/businessStatus';
import { AD_STATUS } from '../../../../shared/enums/adStatus';
import { ACTOR_TYPE } from '../../../../shared/enums/actor';

const sendBusinessAdminError = (req: Request, res: Response, error: unknown) => {
    const message = error instanceof Error ? error.message : 'Admin business operation failed';
    sendErrorResponse(req, res, 500, message);
};

export const getBusinessOverview = async (req: Request, res: Response) => {
    try {
        const overview = await adminBusinessService.getBusinessOverview();
        sendSuccessResponse(res, overview);
    } catch (error: unknown) {
        sendBusinessAdminError(req, res, error);
    }
};

// Shared transform for business documents — used by both getBusinessAccounts and getBusinessRequests.
// Shared transform migrated to adminBusinessService.transformBusinessDocs

export const getBusinessAccounts = async (req: Request, res: Response) => {
    const { status } = req.query;
    const adminQuery = adminBusinessService.getBusinessAccountsQuery(status as string);

    return handlePaginatedContent(req, res, Business as unknown as Model<Document>, {
        populate: 'userId',
        searchFields: ['name', 'email', 'mobile', 'location.city'],
        adminQuery,
        transformResponse: adminBusinessService.transformBusinessDocs
    });
};

export const getBusinessRequests = async (req: Request, res: Response) => {
    return handlePaginatedContent(req, res, Business as unknown as Model<Document>, {
        populate: 'userId',
        searchFields: ['name', 'email', 'mobile', 'location.city'],
        adminQuery: { status: BUSINESS_STATUS.PENDING },
        queryParams: { ...(req.query as Record<string, unknown>), status: BUSINESS_STATUS.PENDING },
        transformResponse: adminBusinessService.transformBusinessDocs
    });
};

export const getBusinessAccountById = async (req: Request, res: Response) => {
    try {
        const business = await Business.findById(req.params.id).populate('userId');
        if (!business) {
            sendErrorResponse(req, res, 404, 'Business not found');
            return;
        }
        sendSuccessResponse(res, business);
    } catch (error: unknown) {
        sendBusinessAdminError(req, res, error);
    }
};

export const approveBusinessAccount = async (req: Request, res: Response) => {
    try {
        const business = await businessService.approveBusiness(req.params.id as string, (req.user as any)?.id || (req.user as any)?._id);

        if (!business) {
            sendErrorResponse(req, res, 404, 'Business not found');
            return;
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

        sendSuccessResponse(res, business, 'Business approved successfully');
    } catch (error: unknown) {
        sendBusinessAdminError(req, res, error);
    }
};

export const rejectBusinessAccount = async (req: Request, res: Response) => {
    try {
        const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
        if (!reason) {
            sendErrorResponse(req, res, 400, 'Rejection reason is required');
            return;
        }
        const business = await businessService.rejectBusiness(
            req.params.id as string, 
            reason, 
            (req.user as any)?.id || (req.user as any)?._id
        );

        if (!business) {
            sendErrorResponse(req, res, 404, 'Business not found');
            return;
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

        // 🛑 CASCADE EXPIRY: Use mutateStatuses for governed termination
        const listings = await AdModel.find({ businessId: business._id, status: { $ne: AD_STATUS.EXPIRED } }).select('_id listingType');
        const actor: any = { type: ACTOR_TYPE.ADMIN, id: (req.user as any)?.id || (req.user as any)?._id };

        if (listings.length > 0) {
            await mutateStatuses(listings.map(l => ({
                domain: (l.listingType === 'service' ? 'service' : (l.listingType === 'spare_part' ? 'spare_part_listing' : 'ad')) as any,
                entityId: l._id,
                toStatus: AD_STATUS.EXPIRED,
                actor,
                reason: `Cascaded from business rejection: ${reason}`
            })));
        }

        logger.info(`Business Rejection Cascade: Expired ${listings.length} listings for business ${business._id}`);

        sendSuccessResponse(res, business, 'Business rejected');
    } catch (error: unknown) {
        sendBusinessAdminError(req, res, error);
    }
};

export const renewBusinessAccount = async (req: Request, res: Response) => {
    try {
        const { days } = req.body;
        const business = await Business.findById(req.params.id);

        if (!business) {
            sendErrorResponse(req, res, 404, 'Business not found');
            return;
        }

        const currentExpiry = business.expiresAt || new Date();
        const newExpiry = new Date(currentExpiry.getTime() + days * MS_IN_DAY);

        const renewedBusiness = await businessService.renewBusiness(
            req.params.id as string, 
            newExpiry, 
            (req.user as any)?.id || (req.user as any)?._id
        );

        if (!renewedBusiness) {
            sendErrorResponse(req, res, 404, 'Business not found');
            return;
        }

        // Sync User.businessStatus back to approved so the owner regains access
        const wasInactive = (business as any).status !== BUSINESS_STATUS.LIVE;
        if (wasInactive) {
            await logAdminAction(req, 'RENEW_BUSINESS', 'Business', req.params.id, { newExpiry, restoredFromStatus: business.status });
        } else {
            await logAdminAction(req, 'RENEW_BUSINESS', 'Business', req.params.id, { newExpiry });
        }

        // Send notification to business owner
        await createInAppNotification(
            business.userId.toString(),
            'BUSINESS_STATUS',
            'Business Renewed! 🎉',
            `Your business "${business.name}" has been renewed. New expiry: ${newExpiry.toLocaleDateString()}.`,
            { businessId: business._id.toString(), status: 'renewed', newExpiry: newExpiry.toISOString() }
        );

        sendSuccessResponse(res, renewedBusiness, 'Business renewed successfully');
    } catch (error: unknown) {
        sendBusinessAdminError(req, res, error);
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
                sendErrorResponse(req, res, 404, 'Business not found');
                return;
            }

            await logAdminAction(req, 'SUSPEND_BUSINESS', 'Business', req.params.id, {
                reason: reason || 'Suspended by admin'
            });
            sendSuccessResponse(res, business, 'Business suspended successfully');
            return;
        }

        sendErrorResponse(req, res, 400, `Invalid status. Allowed: ${BUSINESS_STATUS.LIVE}, ${BUSINESS_STATUS.REJECTED}, ${BUSINESS_STATUS.SUSPENDED}`);
    } catch (error: unknown) {
        sendBusinessAdminError(req, res, error);
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
            'name', 'description', 'mobile', 'email', 'website',
            'gstNumber', 'registrationNumber', 'location', 'businessTypes',
        ];
        const patch: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                patch[field] = req.body[field];
            }
        }
        if (Object.keys(patch).length === 0) {
            sendErrorResponse(req, res, 400, 'No valid fields provided for update');
            return;
        }
        const business = await Business.findByIdAndUpdate(
            req.params.id,
            { $set: patch },
            { new: true, runValidators: true }
        ).populate('userId');
        if (!business) {
            sendErrorResponse(req, res, 404, 'Business not found');
            return;
        }
        await logAdminAction(req, 'UPDATE_BUSINESS', 'Business', req.params.id, { patch });
        sendSuccessResponse(res, business, 'Business updated successfully');
    } catch (error: unknown) {
        sendBusinessAdminError(req, res, error);
    }
};

export const deleteBusinessAccount = async (req: Request, res: Response) => {
    try {
        const business = await Business.findById(req.params.id);
        if (!business) {
            sendErrorResponse(req, res, 404, 'Business not found');
            return;
        }

        const businessName = business.name;
        const userId = business.userId.toString();

        // Cascade: use mutateStatuses for governed termination
        const listings = await AdModel.find({ businessId: business._id, status: { $ne: AD_STATUS.EXPIRED } }).select('_id listingType');
        const actor: any = { type: ACTOR_TYPE.ADMIN, id: (req.user as any)?.id || (req.user as any)?._id };

        if (listings.length > 0) {
            await mutateStatuses(listings.map(l => ({
                domain: (l.listingType === 'service' ? 'service' : (l.listingType === 'spare_part' ? 'spare_part_listing' : 'ad')) as any,
                entityId: l._id,
                toStatus: AD_STATUS.EXPIRED,
                actor,
                reason: `Cascaded from business deletion`
            })));
        }


        // Soft delete the business
        const deleted = await businessService.softDeleteBusiness(req.params.id as string);

        if (!deleted) {
            sendErrorResponse(req, res, 404, 'Business not found');
            return;
        }

        await logAdminAction(req, 'DELETE_BUSINESS', 'Business', req.params.id, {
            businessName,
            cascadedListings: listings.length
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
        sendBusinessAdminError(req, res, error);
    }
};
