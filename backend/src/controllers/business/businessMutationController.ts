import logger from '../../utils/logger';
import { Business } from '../../../../shared/types/Business';
import { ApiResponse } from '../../../../shared/types/Api';
import { respond } from '../../utils/respond';
import { Request, Response } from 'express';
import * as businessService from '../../services/BusinessService';
import { getSingleParam } from '../../utils/requestParams';
import { sendErrorResponse } from '../../utils/errorResponse';
import { resolveDuplicateBusinessMessage, serializeBusinessForOwner } from './shared';
import { getUserPhoneVerification } from '../../services/UserService';

export const registerBusiness = async (req: Request, res: Response) => {
    try {
        const authUser = req.user;
        if (!authUser) {
            sendErrorResponse(req, res, 401, 'Unauthorized');
            return;
        }

        // Fetch user with phone verification status (not in JWT/middleware)
        const user = await getUserPhoneVerification(authUser._id.toString());
        if (!user) {
            sendErrorResponse(req, res, 401, 'User not found');
            return;
        }

        // Spam prevention: Require phone verification before business registration
        if (!user.isPhoneVerified) {
            sendErrorResponse(req, res, 403, 'Phone verification required before registering a business', {
                code: 'PHONE_NOT_VERIFIED'
            });
            return;
        }

        // Spam prevention: Force phone to user's verified mobile (prevent tampering)
        const verifiedPayload = {
            ...(req.body as Record<string, unknown>),
            phone: user.mobile,
            mobile: user.mobile
        };

        const business = await businessService.registerBusiness(verifiedPayload, authUser._id.toString());

        const response = respond<ApiResponse<Business>>({
            success: true,
            data: serializeBusinessForOwner(business) as unknown as Business,
            message: 'Business application submitted successfully. Pending approval.'
        });

        res.status(201).json(response);
    } catch (error: unknown) {
        const duplicateMessage = resolveDuplicateBusinessMessage(error);
        if (duplicateMessage) {
            sendErrorResponse(req, res, 409, duplicateMessage, {
                code: 'BUSINESS_DUPLICATE_CONSTRAINT'
            });
            return;
        }
        const message = error instanceof Error ? error.message : undefined;
        logger.error('Register Business Error:', error);
        sendErrorResponse(req, res, 500, message || 'Failed to register business');
    }
};

export const updateBusiness = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Business ID format' });
        if (!id) return;
        const user = req.user;
        if (!user) {
            sendErrorResponse(req, res, 401, 'Unauthorized');
            return;
        }

        const business = await businessService.getBusinessById(id);
        if (!business) {
            sendErrorResponse(req, res, 404, 'Business not found');
            return;
        }

        if (business.userId.toString() !== user._id.toString() && !['admin', 'super_admin'].includes(user.role)) {
            sendErrorResponse(req, res, 403, 'Unauthorized');
            return;
        }

        // Allow pending edits - users can update their application before admin review
        // Status remains 'pending' so admin still needs to approve

        // 🔒 Suspended businesses cannot be edited by the owner — mirrors frontend canEditBusiness()
        // Only admin may update a suspended business (e.g. to correct data before un-suspending)
        if (business.status === 'suspended' && !['admin', 'super_admin'].includes(user.role)) {
            sendErrorResponse(req, res, 403, 'Cannot edit a suspended business profile', { code: 'BUSINESS_SUSPENDED' });
            return;
        }

        const allowedUpdates = [
            'name', 'description', 'businessTypes',
            'location',
            'mobile', 'phone', 'email', 'website', 'gstNumber', 'registrationNumber', 'workingHours',
            'images', 'documents'
        ];

        const filteredUpdates: Record<string, unknown> = {};
        const bodyRecord = req.body as Record<string, unknown>;
        allowedUpdates.forEach(key => {
            if (Object.prototype.hasOwnProperty.call(bodyRecord, key)) {
                filteredUpdates[key] = bodyRecord[key];
            }
        });

        if (filteredUpdates.phone && !filteredUpdates.mobile) {
            filteredUpdates.mobile = filteredUpdates.phone;
            delete filteredUpdates.phone;
        }

        // Validate coordinates if provided
        if (filteredUpdates.location !== undefined) {
            const loc = filteredUpdates.location as Record<string, unknown> | undefined;
            if (loc && loc.coordinates !== undefined) {
                const coords = loc.coordinates;
                const isValidCoords =
                    Array.isArray(coords) &&
                    coords.length === 2 &&
                    typeof coords[0] === 'number' &&
                    typeof coords[1] === 'number' &&
                    coords[0] >= -180 && coords[0] <= 180 &&
                    coords[1] >= -90 && coords[1] <= 90;
                if (!isValidCoords) {
                    sendErrorResponse(req, res, 400, 'Invalid coordinates. Longitude must be -180 to 180 and latitude -90 to 90.', {
                        code: 'INVALID_COORDINATES'
                    });
                    return;
                }
            }
        }

        // Note: Sensitive status mutation checks moved to `businessService.ts`.

        const updated = await businessService.updateBusinessById(id, filteredUpdates);

        const response = respond<ApiResponse<Business>>({
            success: true,
            data: serializeBusinessForOwner(updated) as unknown as Business
        });

        res.json(response);
    } catch (error: unknown) {
        const duplicateMessage = resolveDuplicateBusinessMessage(error);
        if (duplicateMessage) {
            sendErrorResponse(req, res, 409, duplicateMessage, {
                code: 'BUSINESS_DUPLICATE_CONSTRAINT'
            });
            return;
        }
        sendErrorResponse(req, res, 500, 'Failed to update business');
    }
};

/**
 * Withdraw/cancel a pending business application.
 * DELETE /api/v1/businesses/me
 */
export const withdrawBusiness = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            sendErrorResponse(req, res, 401, 'Unauthorized');
            return;
        }

        const business = await businessService.withdrawBusiness(user._id.toString());

        if (!business) {
            sendErrorResponse(req, res, 404, 'No pending business application found', {
                code: 'NO_PENDING_APPLICATION'
            });
            return;
        }

        const response = respond<ApiResponse<{ message: string }>>({
            success: true,
            data: { message: 'Business application withdrawn successfully' },
            message: 'Application withdrawn'
        });

        res.json(response);
    } catch (error: unknown) {
        logger.error('Withdraw Business Error:', error);
        sendErrorResponse(req, res, 500, 'Failed to withdraw business application');
    }
};
