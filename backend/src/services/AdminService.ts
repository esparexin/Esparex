import Admin, { IAdmin } from '../models/Admin';
import AdminLog from '../models/AdminLog';
import { comparePassword, generateAdminToken } from '../utils/auth';
import { USER_STATUS } from '@shared/enums/userStatus';
import logger from '../utils/logger';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

interface AdminLoginResult {
    token: string;
    admin: Partial<IAdmin>;
}

export const seedAdmin = async (email: string) => {
    // Explicit local bootstrap only. Never seed defaults in production/CI.
    const canSeedDefaultAdmin =
        env.NODE_ENV === 'development' &&
        !env.CI &&
        env.ALLOW_DEFAULT_ADMIN_SEED;

    if (!canSeedDefaultAdmin) return;
    if (email !== 'admin@esparex.com') return;

    // 🛡️ GOVERNANCE: Ensure we are using the Admin DB connection
    const adminConn = Admin.db;
    const isCorrectDb = adminConn.name === 'esparex_admin' || !env.ADMIN_MONGODB_URI;

    if (!isCorrectDb) {
        logger.error('❌ SEED FAILURE: Admin model is bound to incorrect database', {
            expected: 'esparex_admin',
            actual: adminConn.name
        });
        return;
    }

    const adminExists = await Admin.findOne({ email });

    if (adminExists) {
        // 🔄 AUTO-CORRECTION: If admin exists but is not LIVE (e.g. legacy "active" status), fix it.
        if (adminExists.status !== USER_STATUS.LIVE) {
            logger.warn(`Admin ${email} found with status ${adminExists.status}. Auto-correcting to LIVE.`);
            adminExists.status = USER_STATUS.LIVE;
            await adminExists.save();
            logger.info(`✅ Admin ${email} lifecycle stabilized (status: LIVE).`);
        }
        return;
    }

    logger.warn('Seeding default admin account because ALLOW_DEFAULT_ADMIN_SEED=true');
    await Admin.create({
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@esparex.com',
        password: 'Admin@123',
        role: 'super_admin',
        status: USER_STATUS.LIVE
    });
    logger.info(`✅ Seeded new Super Admin: ${email}`);
};

export const loginAdmin = async (email: string, password: string): Promise<AdminLoginResult | null> => {
    await seedAdmin(email);

    const admin = await Admin.findOne({ email }).select('+password');
    let isMatch = false;

    if (admin) {
        if (admin.status !== USER_STATUS.LIVE) {
            throw new AppError('Account is inactive', 403, 'ACCOUNT_INACTIVE');
        }
        if (admin.password) {
            isMatch = await comparePassword(password, admin.password);
        }
    }

    if (!admin || !isMatch) {
        return null; // Invalid credentials
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = generateAdminToken({ id: admin._id, role: admin.role });
    const adminObj = admin.toObject({ virtuals: true }) as Partial<IAdmin>;
    delete adminObj.password;

    return { token, admin: adminObj };
};

export const getAuditLogs = async (
    query: Record<string, unknown>,
    skip: number,
    limit: number
) => {
    const [logs, total] = await Promise.all([
        AdminLog.find(query)
            .skip(skip)
            .limit(limit)
            .populate('adminId', 'firstName lastName email')
            .sort({ createdAt: -1 }),
        AdminLog.countDocuments(query),
    ]);
    return { logs, total };
};

export const getAdminWithTwoFactor = async (adminId: string) => {
    return Admin.findById(adminId).select('+twoFactorSecret +twoFactorEnabled');
};

export const saveAdmin = async (admin: IAdmin) => {
    return admin.save();
};

export const findAdminByEmailForAuth = async (email: string) => {
    return Admin.findOne({ email });
};

export const findAdminByResetToken = async (resetPasswordToken: string) => {
    return Admin.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });
};

export const findAdminForLogin = async (email: string) => {
    return Admin.findOne({ email }).select('+password +twoFactorSecret');
};

export const updateAdminLastLogin = async (id: unknown) => {
    return Admin.updateOne({ _id: id }, { $set: { lastLogin: new Date() } });
};

export const getAdminProfileById = async (adminId: unknown) => {
    return Admin.findById(adminId).lean();
};
