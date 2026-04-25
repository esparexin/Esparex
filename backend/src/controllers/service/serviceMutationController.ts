import logger from '@core/utils/logger';
import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { findOwnedService } from '@core/services/AdMutationService';
import { Service } from '../../../../shared/types/Service';
import { ApiResponse } from '../../../../shared/types/Api';
import { respond } from "@core/utils/respond";
import { getSingleParam } from '@core/utils/requestParams';
import { sendErrorResponse } from "@core/utils/errorResponse";
import { AD_STATUS } from '../../../../shared/enums/adStatus';
import { LISTING_TYPE } from '../../../../shared/enums/listingType';
import { mutateStatus } from '@core/services/StatusMutationService';
import { ACTOR_TYPE } from '../../../../shared/enums/actor';
import type { IAuthUser } from '@core/types/auth';
import {
    createServiceMutation,
    type ServiceBusinessContext,
    updateServiceMutation,
} from '@core/services/service/ServiceMutationService';

const requireOwnedService = async (req: Request, res: Response, fetchFull = false) => {
    const user = req.user;
    if (!user) {
        sendErrorResponse(req, res, 401, 'Unauthorized');
        return null;
    }

    const id = getSingleParam(req, res, 'id', { error: 'Invalid Service ID' });
    if (!id) return null;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        sendErrorResponse(req, res, 400, 'Invalid Service ID');
        return null;
    }

    const service = await findOwnedService(id, user._id, LISTING_TYPE.SERVICE, fetchFull);
    if (!service) {
        sendErrorResponse(req, res, 404, 'Service not found or unauthorized');
        return null;
    }

    return { service, user, id };
};

/* ---------------------------------------------------
   Create Service (Business User)
--------------------------------------------------- */
export const createService = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        const service = await createServiceMutation({
            user: user as unknown as IAuthUser, // Safe boundary cast to core type
            business: req.business as ServiceBusinessContext | undefined,
            body: req.body as Record<string, unknown>,
        });

        const response = respond<ApiResponse<Service>>({
            success: true,
            data: service as unknown as Service,
            message: 'Service submitted for approval.'
        });

        res.status(201).json(response);
    } catch (error: unknown) {
        logger.error('Create Service Error:', error);
        next(error);
    }
};

/* ---------------------------------------------------
   Update Service (Owner Only → Re-review)
--------------------------------------------------- */
export const updateService = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Service ID' });
        if (!id) return;

        const user = req.user;
        const finalServiceData = await updateServiceMutation({
            serviceId: id,
            user: user as unknown as IAuthUser, // Safe boundary cast to core type
            business: req.business as ServiceBusinessContext | undefined,
            body: req.body as Record<string, unknown>,
        });

        const response = respond<ApiResponse<Service>>({
            success: true,
            data: finalServiceData as unknown as Service,
            message: 'Service updated and submitted for re-approval.'
        });

        res.json(response);
    } catch (error) {
        logger.error('Update Service Error:', error);
        next(error);
    }
};

/* ---------------------------------------------------
   Mark Service as Sold (Owner Only)
--------------------------------------------------- */
export const markServiceAsSold = async (req: Request, res: Response) => {
    try {
        const auth = await requireOwnedService(req, res);
        if (!auth) return;
        const { service, user, id } = auth;

        if (service.status !== 'live') { sendErrorResponse(req, res, 400, 'Only live services can be marked as sold'); return; }

        const updated = await mutateStatus({
            domain: 'service',
            entityId: id,
            toStatus: 'sold',
            actor: { type: ACTOR_TYPE.USER, id: user._id.toString() },
            reason: (req.body as { soldReason?: string }).soldReason || 'Marked as sold by seller',
            patch: { soldReason: (req.body as { soldReason?: string }).soldReason, soldAt: new Date() },
        });

        res.json(respond<ApiResponse<Service>>({ success: true, data: updated as unknown as Service, message: 'Service marked as sold' }));
    } catch (error) {
        logger.error('Mark Service Sold Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to mark service as sold');
    }
};

/* ---------------------------------------------------
   Deactivate Service (Owner Only) — LIVE → DEACTIVATED
--------------------------------------------------- */
export const deactivateService = async (req: Request, res: Response) => {
    try {
        const auth = await requireOwnedService(req, res);
        if (!auth) return;
        const { user, id } = auth;

        const updated = await mutateStatus({
            domain: 'service',
            entityId: id,
            toStatus: 'deactivated',
            actor: { type: ACTOR_TYPE.USER, id: user._id.toString() },
            reason: 'Deactivated by seller',
        });

        res.json(respond<ApiResponse<Service>>({ success: true, data: updated as unknown as Service, message: 'Service deactivated' }));
    } catch (error) {
        logger.error('Deactivate Service Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to deactivate service');
    }
};

/* ---------------------------------------------------
   Repost Service (Owner Only) — EXPIRED/REJECTED → PENDING
--------------------------------------------------- */
export const repostService = async (req: Request, res: Response) => {
    try {
        const auth = await requireOwnedService(req, res);
        if (!auth) return;
        const { service, user, id } = auth;

        const currentStatus = (service.status || 'unknown') as string;
        if (currentStatus !== AD_STATUS.EXPIRED && currentStatus !== AD_STATUS.REJECTED) {
            sendErrorResponse(req, res, 400, 'Only expired or rejected services can be reposted');
            return;
        }

        const updated = await mutateStatus({
            domain: 'service',
            entityId: id,
            toStatus: AD_STATUS.PENDING,
            actor: { type: ACTOR_TYPE.USER, id: user._id.toString() },
            reason: 'Reposted by seller for review',
            metadata: { action: 'repost' },
        });

        res.json(respond<ApiResponse<Service>>({ success: true, data: updated as unknown as Service, message: 'Service reposted and under review' }));
    } catch (error) {
        logger.error('Repost Service Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to repost service');
    }
};

/* ---------------------------------------------------
   Delete Service (Owner Only)
--------------------------------------------------- */
export const deleteService = async (req: Request, res: Response) => {
    try {
        const auth = await requireOwnedService(req, res, true);
        if (!auth) return;
        const { service } = auth;

        // 🛡️ Soft Delete
        await (service as unknown as { softDelete: () => Promise<void> }).softDelete();

        res.status(204).end();
    } catch (error) {
        logger.error('Delete Service Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to delete service');
    }
};
