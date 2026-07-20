import Admin, { IAdmin } from '../../../../../models/Admin';
import User from '../../../../../models/User';
import { USER_STATUS, Role } from '@esparex/contracts';
import { hashPassword } from '../../auth/auth';
import { AppError } from '../../../../../utils/AppError';
import type { AdminLogFn } from '../../../../../services/AdminListingsService';
import { recalculateTrustScore } from '../../../../../services/TrustService';
import { revokeAdminSessionsForAdmin } from '../../sessions/AdminSessionService';
import { normalizeAdminManagedUser, ALLOWED_ADMIN_ROLES, ensureRoleAssignmentAllowed } from './helpers';
import { isLastActiveSuperAdmin } from './superAdmin';

export const getAdmins = async (pagination: { skip?: number; limit?: number } = {}) => {
    const skip = pagination.skip ?? 0;
    const limit = pagination.limit ?? 50;
    const [admins, total] = await Promise.all([
        Admin.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
        Admin.countDocuments(),
    ]);
    return { data: admins, total };
};
export const getAdminByIdForAdmin = async (id: string) => Admin.findById(id).select('-password');
export const getUserByIdForAdmin = async (id: string) => User.findById(id).select('-password');

export const updateAdminUser = async (userId: string, data: Record<string, unknown>, actorId: string, logFn: AdminLogFn) => {
    const { name, email, mobile } = data as { name?: string; email?: string; mobile?: string };
    if (email || mobile) {
        const orClauses: Record<string, unknown>[] = [];
        if (email) orClauses.push({ email });
        if (mobile) orClauses.push({ mobile });
        if (orClauses.length > 0) { const exists = await User.findOne({ _id: { $ne: userId }, $or: orClauses }); if (exists) throw new AppError('Email or Mobile already in use', 409, 'USER_ALREADY_EXISTS'); }
    }
    const updateData: Record<string, unknown> = { updatedBy: actorId };
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (mobile !== undefined) updateData.mobile = mobile;
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    await logFn('UPDATE_USER', 'User', userId, { changes: Object.keys(data) });
    return normalizeAdminManagedUser(user as any);
};

export const verifyUserById = async (id: string, isVerified: boolean, actorId: string, logFn: AdminLogFn) => {
    const user = await User.findByIdAndUpdate(id, { isVerified }, { new: true }).select('-password');
    if (!user) throw new AppError('User not found', 404);
    await logFn('VERIFY_USER', 'User', String(user._id), { isVerified });
    setImmediate(() => void recalculateTrustScore(user._id).catch(() => {}));
    return normalizeAdminManagedUser(user as any);
};

export const findAdminByEmail = async (email: string) => Admin.findOne({ email });

export const createAdminAccount = async (data: Record<string, unknown>, actorRole: string, actorId: string, logFn: AdminLogFn) => {
    const d = data as { firstName?: string; lastName?: string; name?: string; email?: string; mobile?: string; password?: string; role?: string; permissions?: string[] };
    const normalizedEmail = typeof d.email === 'string' ? d.email.trim().toLowerCase() : '';
    const nf = typeof d.firstName === 'string' ? d.firstName.trim() : typeof d.name === 'string' ? d.name.trim().split(/\s+/)[0] || '' : '';
    const nl = typeof d.lastName === 'string' ? d.lastName.trim() : typeof d.name === 'string' ? d.name.trim().split(/\s+/).slice(1).join(' ') : '';
    if (!nf || !nl || !normalizedEmail || !d.password) throw new AppError('Name, email, and password are required', 400);
    const exists = await findAdminByEmail(normalizedEmail);
    if (exists) throw new AppError('Admin with this email already exists', 409);
    const normalizedRole = typeof d.role === 'string' && ALLOWED_ADMIN_ROLES.has(d.role as Role) ? d.role : Role.ADMIN;
    if (!ensureRoleAssignmentAllowed(actorRole, normalizedRole)) throw new AppError('Cannot assign a role higher than your own', 403);
    const permissions = Array.isArray(d.permissions) ? d.permissions.filter((v) => typeof v === 'string') : [];
    const newAdmin = await Admin.create({ firstName: nf, lastName: nl, email: normalizedEmail, mobile: d.mobile, password: d.password, role: normalizedRole as IAdmin['role'], permissions, status: USER_STATUS.LIVE });
    const ao = newAdmin.toObject() as any; delete ao.password;
    await logFn('CREATE_ADMIN', 'Admin', newAdmin._id.toString(), { role: normalizedRole, permissions });
    return ao;
};

export const updateAdminById = async (id: string, updateDataRaw: Record<string, unknown>, currentId: string, actorRole: string, logFn: AdminLogFn) => {
    const d = updateDataRaw as { firstName?: string; lastName?: string; email?: string; mobile?: string; permissions?: string[]; status?: string; password?: string; role?: string };
    if (id === currentId && d.status && [USER_STATUS.SUSPENDED, USER_STATUS.BANNED, USER_STATUS.INACTIVE].includes(d.status as any)) throw new AppError('You cannot suspend/deactivate your own admin account', 400);
    if (id === currentId && d.role) throw new AppError('You cannot change your own role', 400);
    if (d.status && [USER_STATUS.SUSPENDED, USER_STATUS.BANNED, USER_STATUS.INACTIVE].includes(d.status as any)) { if (await isLastActiveSuperAdmin(id)) throw new AppError(`Cannot suspend/deactivate the last active Super Admin`, 400); }
    const updateData: Record<string, unknown> = {};
    if (d.firstName) updateData.firstName = d.firstName;
    if (d.lastName) updateData.lastName = d.lastName;
    if (d.email) updateData.email = d.email;
    if (d.mobile) updateData.mobile = d.mobile;
    if (d.permissions) updateData.permissions = d.permissions;
    if (d.status) updateData.status = d.status;
    if (d.role) { if (!ALLOWED_ADMIN_ROLES.has(d.role as Role)) throw new AppError('Invalid admin role', 400); if (!ensureRoleAssignmentAllowed(actorRole, d.role)) throw new AppError('Cannot assign a role higher than your own', 403); updateData.role = d.role; }
    if (d.password?.trim()) updateData.password = await hashPassword(d.password);
    if (await isLastActiveSuperAdmin(id) && d.role && d.role !== Role.SUPER_ADMIN) throw new AppError('Cannot downgrade the last active Super Admin', 400);
    const updatedAdmin = await Admin.findByIdAndUpdate(id, { $set: updateData }, { new: true }).select('-password');
    if (!updatedAdmin) throw new AppError('Admin not found', 404);
    if (d.status && [USER_STATUS.INACTIVE, USER_STATUS.SUSPENDED, USER_STATUS.BANNED].includes(d.status as any)) await revokeAdminSessionsForAdmin(id);
    await logFn('UPDATE_ADMIN', 'Admin', String(id), { changes: Object.keys(updateData) });
    return updatedAdmin;
};

export const softDeleteAdminById = async (id: string, currentId: string, logFn: AdminLogFn) => {
    if (id === currentId) throw new AppError('You cannot delete yourself', 400);
    if (await isLastActiveSuperAdmin(id)) throw new AppError('Cannot delete the last active Super Admin', 400);
    const admin = await Admin.findById(id);
    if (!admin) throw new AppError('Admin not found', 404);
    await (admin as any).softDelete();
    await revokeAdminSessionsForAdmin(id);
    await logFn('DELETE_ADMIN', 'Admin', id, { email: (admin as any).email });
    return admin;
};

export const deactivateAdminById = async (id: string, currentId: string, logFn: AdminLogFn) => {
    if (id === currentId) throw new AppError('You cannot deactivate yourself', 400);
    if (await isLastActiveSuperAdmin(id)) throw new AppError('Cannot deactivate the last active Super Admin', 400);
    const admin = await Admin.findByIdAndUpdate(id, { status: USER_STATUS.INACTIVE }, { new: true }).select('-password');
    if (!admin) throw new AppError('Admin not found', 404);
    await revokeAdminSessionsForAdmin(id);
    await logFn('DEACTIVATE_ADMIN', 'Admin', id, { status: 'inactive' });
    return admin;
};

export const toggleAdminStatus = async (id: string, currentId: string, logFn: AdminLogFn) => {
    const admin = await Admin.findById(id);
    if (!admin) throw new AppError('Admin not found', 404);
    const isActive = admin.status === USER_STATUS.LIVE;
    const nextStatus = isActive ? USER_STATUS.INACTIVE : USER_STATUS.LIVE;
    if (id === currentId && isActive && nextStatus === USER_STATUS.INACTIVE) throw new AppError('You cannot deactivate yourself', 400);
    if (isActive && await isLastActiveSuperAdmin(id)) throw new AppError('Cannot deactivate the last active Super Admin', 400);
    admin.status = nextStatus;
    await admin.save();
    if (nextStatus === USER_STATUS.INACTIVE) await revokeAdminSessionsForAdmin(id);
    const ao = admin.toObject(); delete (ao as any).password;
    await logFn('TOGGLE_ADMIN_STATUS', 'Admin', id, { status: nextStatus });
    return ao;
};
