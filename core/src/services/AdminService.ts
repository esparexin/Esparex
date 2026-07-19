import Admin, { IAdmin } from '../models/Admin';
import { Types } from 'mongoose';
import AdminLog from '../models/AdminLog';
import { USER_STATUS } from '@esparex/contracts';
import logger from '../utils/logger';
import { env } from '../config/env';
import { escapeRegExp } from '../utils/stringUtils';
import { Role } from '@esparex/contracts';
import { normalizeRole } from '../utils/roleNormalization';

export const seedAdmin = async (email: string) => {
    // Explicit local bootstrap only. Never seed defaults in production/CI.
    const canSeedDefaultAdmin =
        env.NODE_ENV === 'development' &&
        !env.CI &&
        env.ALLOW_DEFAULT_ADMIN_SEED;

    logger.info(`seedAdmin checking: email=${email}, env=${env.NODE_ENV}, CI=${env.CI}, ALLOW_SEED=${env.ALLOW_DEFAULT_ADMIN_SEED}, canSeed=${canSeedDefaultAdmin}`);

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
        logger.info(`Admin ${email} already exists in DB. Status: ${adminExists.status}`);
        
        // 🔄 AUTO-CORRECTION: If admin exists but is not LIVE (e.g. legacy "active" status), fix it.
        if (adminExists.status !== USER_STATUS.LIVE) {
            logger.warn(`Admin ${email} found with status ${adminExists.status}. Auto-correcting to LIVE.`);
            adminExists.status = USER_STATUS.LIVE;
            await adminExists.save();
            logger.info(`✅ Admin ${email} lifecycle stabilized (status: LIVE).`);
        }

        // 🛡️ RECOVERY: Ensure default admin password is 'Admin@123' in local development
        // This forces synchronization if the admin exists but credentials are out of sync.
        if (env.NODE_ENV === 'development' && email === 'admin@esparex.com') {
            adminExists.password = 'Admin@123';
            // Also ensure status is LIVE
            adminExists.status = USER_STATUS.LIVE;
            await adminExists.save();
            logger.info(`✅ Default admin credentials synchronized to 'admin@esparex.com' / 'Admin@123'`);
        }
        return;
    }

    logger.warn('Seeding default admin account because ALLOW_DEFAULT_ADMIN_SEED=true');
    try {
        await Admin.create({
            firstName: 'Super',
            lastName: 'Admin',
            email: 'admin@esparex.com',
            password: 'Admin@123',
            role: Role.SUPER_ADMIN,
            status: USER_STATUS.LIVE
        });
        logger.info(`✅ Seeded new Super Admin: ${email}`);
    } catch (createError: unknown) {
        logger.error('❌ SEED ERROR: Failed to create default admin', {
            email,
            error: createError instanceof Error ? createError.message : String(createError)
        });
        // We don't re-throw here to allow the login attempt to proceed (it will just fail with 401 later)
    }
};

export const getAuditLogs = async (
    filters: { 
        q?: unknown;
        action?: unknown; 
        targetType?: unknown; 
        adminId?: unknown; 
        requestId?: unknown; 
        correlationId?: unknown; 
    },
    skip: number,
    limit: number
) => {
    const query: Record<string, unknown> & { $and?: unknown[] } = {};
    if (filters.action) query.action = filters.action;
    if (filters.targetType) query.targetType = filters.targetType;
    if (filters.adminId) query.adminId = filters.adminId;
    if (filters.requestId) query['metadata.requestId'] = filters.requestId;
    if (filters.correlationId) query['metadata.correlationId'] = filters.correlationId;

    const normalizedQuery = typeof filters.q === 'string' ? filters.q.trim() : '';
    if (normalizedQuery) {
        const safeSearch = escapeRegExp(normalizedQuery);
        const adminMatches = await Admin.find({
            $or: [
                { firstName: { $regex: safeSearch, $options: 'i' } },
                { lastName: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } },
            ],
        }).select('_id').limit(50).lean();

        const searchConditions: Record<string, unknown>[] = [
            { action: { $regex: safeSearch, $options: 'i' } },
            { targetType: { $regex: safeSearch, $options: 'i' } },
            { targetId: { $regex: safeSearch, $options: 'i' } },
            { ipAddress: { $regex: safeSearch, $options: 'i' } },
            { userAgent: { $regex: safeSearch, $options: 'i' } },
            { 'metadata.requestId': { $regex: safeSearch, $options: 'i' } },
            { 'metadata.correlationId': { $regex: safeSearch, $options: 'i' } },
        ];

        if (adminMatches.length > 0) {
            searchConditions.push({ adminId: { $in: adminMatches.map((admin) => admin._id) } });
        }

        query.$and = [
            ...(Array.isArray(query.$and) ? query.$and : []),
            { $or: searchConditions },
        ];
    }

    const [logs, total] = await Promise.all([
        AdminLog.find(query as Record<string, unknown>)
            .skip(skip)
            .limit(limit)
            .populate('adminId', 'firstName lastName email')
            .sort({ createdAt: -1 }),
        AdminLog.countDocuments(query as Record<string, unknown>),
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

export const updateAdminLastLogin = async (id: string | { toString(): string }) => {
    return Admin.updateOne({ _id: new Types.ObjectId(id.toString()) }, { $set: { lastLogin: new Date() } });
};

export const getAdminProfileById = async (adminId: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- lean() type is nominal; role normalization requires mutable indexable shape
    const admin = await Admin.findById(adminId).lean() as any;
    if (admin && admin.role) {
        admin.role = normalizeRole(admin.role);
    }
    return admin;
};
