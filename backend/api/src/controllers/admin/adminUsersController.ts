import { Request, Response } from 'express';
import * as userStatusService from '@esparex/core/services/UserStatusService';
import {
    sendSuccessResponse,
    getPaginationParams,
    sendPaginatedResponse,
    sendAdminError
} from '../../utils/adminBaseController';
import { USER_STATUS, UserStatusValue } from "@esparex/shared";
import * as adminUsersService from '@esparex/core/services/AdminUsersService';
import { logAdminActionDirect } from '../../utils/adminLogger';
import type { AdminLogFn } from '@esparex/core/services/AdminListingsService';
import type { IAuthUser } from '@esparex/core/types/auth';

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

const getActorId = (req: Request): string =>
    (req.user as IAuthUser)?._id?.toString() ?? (req.user as IAuthUser)?.id ?? '';

const getActorRole = (req: Request): string =>
    ((req.user as IAuthUser)?.role) ?? '';

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

export const getUsers = async (req: Request, res: Response) => {
    try {
        const { page, limit, skip } = getPaginationParams(req);
        const search = (req.query.q || req.query.search) as string;
        const status = req.query.status as string;
        const role = req.query.role as string;
        const isVerified =
            typeof req.query.isVerified === 'boolean'
                ? req.query.isVerified
                : req.query.isVerified !== undefined
                    ? req.query.isVerified === 'true'
                    : undefined;

        const { data, total } = await adminUsersService.getUsers(
            { search, status, role, isVerified },
            { skip, limit }
        );

        sendPaginatedResponse(res, data, total, page, limit);
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const getUserManagementOverview = async (req: Request, res: Response) => {
    try {
        const summary = await adminUsersService.getUserManagementOverview();
        sendSuccessResponse(res, summary);
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const getAdmins = async (req: Request, res: Response) => {
    try {
        const admins = await adminUsersService.getAdmins();
        sendSuccessResponse(res, admins);
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const getAdminById = async (req: Request, res: Response) => {
    try {
        const admin = await adminUsersService.getAdminByIdForAdmin(req.params.id as string);
        if (!admin) {
            return sendAdminError(req, res, 'Admin not found', 404);
        }
        sendSuccessResponse(res, admin);
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const user = await adminUsersService.getUserByIdForAdmin(req.params.id as string);
        if (!user) {
            return sendAdminError(req, res, 'User not found', 404);
        }
        sendSuccessResponse(res, adminUsersService.normalizeAdminManagedUser(user as unknown as Record<string, unknown>));
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const verifyUser = async (req: Request, res: Response) => {
    try {
        const { isVerified: verified } = req.body as { isVerified: boolean };
        const user = await adminUsersService.verifyUserById(
            req.params.id as string,
            verified,
            getActorId(req),
            buildLogFn(req)
        );
        sendSuccessResponse(res, user, 'User verification updated');
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

// ADMIN MANAGEMENT

export const createUser = async (req: Request, res: Response) => {
    try {
        const userObj = await adminUsersService.createAdminUser(
            req.body as Record<string, unknown>,
            getActorId(req),
            buildLogFn(req)
        );
        sendSuccessResponse(res, userObj, 'User created successfully');
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id: userId } = req.params;
        if (!userId || typeof userId !== 'string') {
            return sendAdminError(req, res, 'Invalid user id', 400);
        }
        const user = await adminUsersService.updateAdminUser(
            userId,
            req.body as Record<string, unknown>,
            getActorId(req),
            buildLogFn(req)
        );
        sendSuccessResponse(res, user, 'User updated successfully');
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const updateUserStatus = async (req: Request, res: Response) => {
    try {
        const { status, reason } = req.body as { status: string; reason?: string };
        const { id: userId } = req.params;

        if (![USER_STATUS.LIVE as string, USER_STATUS.SUSPENDED as string, USER_STATUS.BANNED as string].includes(status)) {
            return sendAdminError(req, res, 'Invalid status', 400);
        }

        if (!userId || typeof userId !== 'string') {
            return sendAdminError(req, res, 'Invalid user id', 400);
        }

        const user = await userStatusService.updateUserStatus(userId, status as UserStatusValue, {
            actor: 'ADMIN',
            logFn: buildLogFn(req),
            reason
        });

        sendSuccessResponse(res, adminUsersService.normalizeAdminManagedUser(user as unknown as Record<string, unknown>), `User status updated to ${status}`);
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const createAdmin = async (req: Request, res: Response) => {
    try {
        const adminObj = await adminUsersService.createAdminAccount(
            req.body as Record<string, unknown>,
            getActorRole(req),
            getActorId(req),
            buildLogFn(req)
        );
        sendSuccessResponse(res, adminObj, 'Admin created successfully');
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const updateAdmin = async (req: Request, res: Response) => {
    try {
        const targetId = typeof req.params.id === 'string' ? req.params.id : '';
        if (!targetId) {
            return sendAdminError(req, res, 'Invalid admin id', 400);
        }
        const updatedAdmin = await adminUsersService.updateAdminById(
            targetId,
            req.body as Record<string, unknown>,
            getActorId(req),
            getActorRole(req),
            buildLogFn(req)
        );
        sendSuccessResponse(res, updatedAdmin, 'Admin updated successfully');
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const deleteAdmin = async (req: Request, res: Response) => {
    try {
        const targetId = typeof req.params.id === 'string' ? req.params.id : '';
        if (!targetId) {
            return sendAdminError(req, res, 'Invalid admin id', 400);
        }
        await adminUsersService.softDeleteAdminById(targetId, getActorId(req), buildLogFn(req));
        sendSuccessResponse(res, null, 'Admin deleted successfully');
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const deactivateAdmin = async (req: Request, res: Response) => {
    try {
        const targetId = typeof req.params.id === 'string' ? req.params.id : '';
        if (!targetId) {
            return sendAdminError(req, res, 'Invalid admin id', 400);
        }
        const admin = await adminUsersService.deactivateAdminById(targetId, getActorId(req), buildLogFn(req));
        sendSuccessResponse(res, admin, 'Admin deactivated successfully');
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const toggleAdminStatus = async (req: Request, res: Response) => {
    try {
        const targetId = typeof req.params.id === 'string' ? req.params.id : '';
        if (!targetId) {
            return sendAdminError(req, res, 'Invalid admin id', 400);
        }
        const adminObj = await adminUsersService.toggleAdminStatus(targetId, getActorId(req), buildLogFn(req));
        sendSuccessResponse(res, adminObj, `Admin status updated`);
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        await userStatusService.updateUserStatus(req.params.id as string, USER_STATUS.DELETED, {
            actor: 'ADMIN',
            logFn: buildLogFn(req),
            reason: 'Admin Soft Delete'
        });
        sendSuccessResponse(res, null, 'User deleted successfully (Soft Delete)');
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};
