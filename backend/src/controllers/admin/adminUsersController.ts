import { Request, Response } from 'express';
import { logAdminAction } from '../../utils/adminLogger';
import * as userStatusService from '../../services/UserStatusService';
import { recalculateTrustScore } from '../../services/TrustService';
import { hashPassword } from '../../utils/auth';
import {
    sendSuccessResponse,
    getPaginationParams,
    sendPaginatedResponse,
    sendAdminError
} from './adminBaseController';
import { IAuthUser } from '../../types/auth';
import { Role } from '../../../../shared/enums/roles';
import { revokeAdminSessionsForAdmin } from '../../services/AdminSessionService';
import { USER_STATUS } from '../../../../shared/enums/userStatus';
import * as adminUsersService from '../../services/AdminUsersService';

// Local helper removed, using centralized sendAdminError.

const ADMIN_ROLE_RANK: Record<string, number> = {
    viewer: 10,
    editor: 20,
    content_moderator: 30,
    moderator: 40,
    finance_manager: 50,
    user_manager: 60,
    admin: 70,
    super_admin: 100
};

const ALLOWED_ADMIN_ROLES = new Set([
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.MODERATOR,
    'user_manager',
    'finance_manager',
    'content_moderator',
    'editor',
    'viewer',
    'custom'
]);

const getRoleRank = (role: string | undefined): number => ADMIN_ROLE_RANK[role || ''] || 0;

const ensureRoleAssignmentAllowed = (actorRole: string | undefined, targetRole: string): boolean => {
    if (!actorRole) return false;
    if (actorRole === Role.SUPER_ADMIN) return true;
    return getRoleRank(targetRole) <= getRoleRank(actorRole);
};


export const getUsers = async (req: Request, res: Response) => {
    try {
        const { page, limit, skip } = getPaginationParams(req);
        const search = req.query.search as string;
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
        sendSuccessResponse(res, adminUsersService.normalizeAdminManagedUser(user));
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const verifyUser = async (req: Request, res: Response) => {
    try {
        const verified = req.body.isVerified;
        const user = await adminUsersService.verifyUserById(req.params.id as string, verified);

        if (!user) {
            return sendAdminError(req, res, 'User not found', 404);
        }

        await logAdminAction(req, 'VERIFY_USER', 'User', String(req.params.id), { isVerified: verified });

        // 🏆 TRUST SCORE: Recalculate on verification change
        setImmediate(() => recalculateTrustScore(user._id).catch(() => { }));

        sendSuccessResponse(res, adminUsersService.normalizeAdminManagedUser(user), 'User verification updated');
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

// ADMIN MANAGEMENT

export const createUser = async (req: Request, res: Response) => {
    try {
        const { name, email, mobile, password, isVerified } = req.body;

        if (!mobile || !name) {
            return sendAdminError(req, res, 'Name and Mobile are required', 400);
        }

        const userObj = await adminUsersService.createAdminUser(
            { name, email, mobile, password, isVerified },
            (req.user as IAuthUser)._id.toString()
        );

        await logAdminAction(req, 'CREATE_USER', 'User', userObj._id.toString(), { name, mobile, role: Role.USER });
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
            req.body,
            (req.user as IAuthUser)._id.toString()
        );

        await logAdminAction(req, 'UPDATE_USER', 'User', userId, { changes: Object.keys(req.body) });
        sendSuccessResponse(res, user, 'User updated successfully');
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const updateUserStatus = async (req: Request, res: Response) => {
    try {
        const { status, reason } = req.body;
        const { id: userId } = req.params;

        if (![USER_STATUS.ACTIVE, USER_STATUS.SUSPENDED, USER_STATUS.BANNED].includes(status as any)) {
            return sendAdminError(req, res, 'Invalid status', 400);
        }

        if (!userId || typeof userId !== 'string') {
            return sendAdminError(req, res, 'Invalid user id', 400);
        }

        const user = await userStatusService.updateUserStatus(userId, status, {
            actor: 'ADMIN',
            adminReq: req,
            reason
        });

        sendSuccessResponse(res, adminUsersService.normalizeAdminManagedUser(user), `User status updated to ${status}`);
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const createAdmin = async (req: Request, res: Response) => {
    try {
        const {
            firstName,
            lastName,
            name,
            email,
            mobile,
            password,
            role,
            permissions
        } = req.body || {};

        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const normalizedPassword = typeof password === 'string' ? password : '';

        const derivedFirstName = typeof firstName === 'string'
            ? firstName.trim()
            : typeof name === 'string'
                ? name.trim().split(/\s+/)[0] || ''
                : '';

        const derivedLastName = typeof lastName === 'string'
            ? lastName.trim()
            : typeof name === 'string'
                ? name.trim().split(/\s+/).slice(1).join(' ')
                : '';

        if (!derivedFirstName || !derivedLastName || !normalizedEmail || !normalizedPassword) {
            return sendAdminError(req, res, 'Name, email, and password are required', 400);
        }

        // Check if exists
        const exists = await adminUsersService.findAdminByEmail(normalizedEmail);
        if (exists) {
            return sendAdminError(req, res, 'Admin with this email already exists', 409);
        }

        const normalizedRole =
            typeof role === 'string' && ALLOWED_ADMIN_ROLES.has(role)
                ? role
                : Role.ADMIN;

        const actorRole = (req.user as IAuthUser | undefined)?.role;
        if (!ensureRoleAssignmentAllowed(actorRole, normalizedRole)) {
            return sendAdminError(req, res, 'Cannot assign a role higher than your own', 403);
        }

        const normalizedPermissions = Array.isArray(permissions)
            ? permissions.filter((value) => typeof value === 'string')
            : [];

        const newAdmin = await adminUsersService.createAdminAccount({
            firstName: derivedFirstName,
            lastName: derivedLastName,
            email: normalizedEmail,
            mobile,
            // Model pre-save hook hashes passwords; avoid pre-hashing to prevent double hashing.
            password: normalizedPassword,
            role: normalizedRole,
            permissions: normalizedPermissions,
        });

        const adminObj = newAdmin.toObject() as unknown as Record<string, unknown>;
        delete adminObj.password;

        await logAdminAction(req, 'CREATE_ADMIN', 'Admin', newAdmin._id.toString(), {
            role: normalizedRole,
            permissions: normalizedPermissions
        });
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
        const { firstName, lastName, email, mobile, permissions, status, password, role } = req.body;
        const currentId = (req.user as IAuthUser)._id.toString();

        if (targetId === currentId && [USER_STATUS.SUSPENDED, USER_STATUS.BANNED, USER_STATUS.INACTIVE].includes(status)) {
            return sendAdminError(req, res, 'You cannot suspend/deactivate your own admin account', 400);
        }
        if (targetId === currentId && role) {
            return sendAdminError(req, res, 'You cannot change your own role', 400);
        }

        if (await adminUsersService.isLastActiveSuperAdmin(targetId) && [USER_STATUS.SUSPENDED, USER_STATUS.BANNED, USER_STATUS.INACTIVE].includes(status)) {
            return sendAdminError(req, res, 'Cannot suspend/deactivate the last active Super Admin', 400);
        }

        const updateData: Record<string, unknown> = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (email) updateData.email = email;
        if (mobile) updateData.mobile = mobile;
        if (permissions) updateData.permissions = permissions;
        if (status) updateData.status = status;
        if (role) {
            if (typeof role !== 'string' || !ALLOWED_ADMIN_ROLES.has(role)) {
                return sendAdminError(req, res, 'Invalid admin role', 400);
            }
            const actorRole = (req.user as IAuthUser | undefined)?.role;
            if (!ensureRoleAssignmentAllowed(actorRole, role)) {
                return sendAdminError(req, res, 'Cannot assign a role higher than your own', 403);
            }
            updateData.role = role;
        }

        if (password && password.trim().length > 0) {
            updateData.password = await hashPassword(password);
        }

        if (await adminUsersService.isLastActiveSuperAdmin(targetId) && role && role !== Role.SUPER_ADMIN) {
            return sendAdminError(req, res, 'Cannot downgrade the last active Super Admin', 400);
        }

        const updatedAdmin = await adminUsersService.updateAdminById(targetId, updateData);

        if (!updatedAdmin) {
            return sendAdminError(req, res, 'Admin not found', 404);
        }

        if (status && [USER_STATUS.INACTIVE, USER_STATUS.SUSPENDED, USER_STATUS.BANNED].includes(status)) {
            await revokeAdminSessionsForAdmin(targetId);
        }

        await logAdminAction(req, 'UPDATE_ADMIN', 'Admin', String(targetId), { changes: Object.keys(updateData) });
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
        const currentId = (req.user as IAuthUser)._id;

        if (targetId === currentId.toString()) {
            return sendAdminError(req, res, 'You cannot delete yourself', 400);
        }

        if (await adminUsersService.isLastActiveSuperAdmin(targetId)) {
            return sendAdminError(req, res, 'Cannot delete the last active Super Admin', 400);
        }

        const admin = await adminUsersService.softDeleteAdminById(targetId);
        if (!admin) {
            return sendAdminError(req, res, 'Admin not found', 404);
        }

        await revokeAdminSessionsForAdmin(targetId);

        await logAdminAction(req, 'DELETE_ADMIN', 'Admin', targetId, { email: (admin as any).email });
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
        const currentId = (req.user as IAuthUser)._id.toString();

        if (targetId === currentId) {
            return sendAdminError(req, res, 'You cannot deactivate yourself', 400);
        }

        if (await adminUsersService.isLastActiveSuperAdmin(targetId)) {
            return sendAdminError(req, res, 'Cannot deactivate the last active Super Admin', 400);
        }

        const admin = await adminUsersService.deactivateAdminById(targetId);

        if (!admin) {
            return sendAdminError(req, res, 'Admin not found', 404);
        }

        await revokeAdminSessionsForAdmin(targetId);
        await logAdminAction(req, 'DEACTIVATE_ADMIN', 'Admin', targetId, { status: 'inactive' });
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
        const currentId = (req.user as IAuthUser)._id.toString();

        const admin = await adminUsersService.findAdminForUpdate(targetId);
        if (!admin) {
            return sendAdminError(req, res, 'Admin not found', 404);
        }

        const isCurrentlyActive = admin.status === USER_STATUS.ACTIVE;
        const nextStatus = isCurrentlyActive ? USER_STATUS.INACTIVE : USER_STATUS.ACTIVE;

        if (targetId === currentId && !isCurrentlyActive === false) {
             // Case: currently active, trying to set to inactive
            if (nextStatus === USER_STATUS.INACTIVE) {
                return sendAdminError(req, res, 'You cannot deactivate yourself', 400);
            }
        }

        if (isCurrentlyActive && await adminUsersService.isLastActiveSuperAdmin(targetId)) {
            return sendAdminError(req, res, 'Cannot deactivate the last active Super Admin', 400);
        }

        admin.status = nextStatus;
        await adminUsersService.saveAdminDocument(admin);

        if (nextStatus === USER_STATUS.INACTIVE) {
            await revokeAdminSessionsForAdmin(targetId);
        }

        const adminObj = admin.toObject();
        delete (adminObj as any).password;

        await logAdminAction(req, 'TOGGLE_ADMIN_STATUS', 'Admin', targetId, { status: nextStatus });
        sendSuccessResponse(res, adminObj, `Admin status updated to ${nextStatus}`);
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        await userStatusService.updateUserStatus(req.params.id as string, USER_STATUS.DELETED, {
            actor: 'ADMIN',
            adminReq: req,
            reason: 'Admin Soft Delete'
        });
        sendSuccessResponse(res, null, 'User deleted successfully (Soft Delete)');
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};
