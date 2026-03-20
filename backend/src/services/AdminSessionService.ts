import AdminSession, { hashAdminSessionToken } from '../models/AdminSession';

const ADMIN_SESSION_TTL_MS = Number(process.env.ADMIN_SESSION_TTL_MS || 8 * 60 * 60 * 1000);

export const getAdminSessionTtlMs = (): number => ADMIN_SESSION_TTL_MS;

export const createAdminSession = async (params: {
    adminId: string;
    token: string;
    tokenId?: string;
    ip?: string;
    device?: string;
}) => {
    const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_MS);
    const tokenHash = hashAdminSessionToken(params.token);

    return AdminSession.create({
        adminId: params.adminId,
        tokenHash,
        tokenId: params.tokenId,
        ip: params.ip,
        device: params.device,
        expiresAt
    });
};

export const validateAdminSession = async (params: {
    adminId: string;
    token: string;
    tokenId?: string;
}) => {
    const tokenHash = hashAdminSessionToken(params.token);
    const query: Record<string, unknown> = {
        adminId: params.adminId,
        tokenHash,
        revokedAt: { $exists: false },
        expiresAt: { $gt: new Date() }
    };
    if (params.tokenId) query.tokenId = params.tokenId;

    return AdminSession.findOne(query).lean();
};

export const revokeAdminSession = async (token: string) => {
    const tokenHash = hashAdminSessionToken(token);
    return AdminSession.updateOne(
        { tokenHash, revokedAt: { $exists: false } },
        { $set: { revokedAt: new Date() } }
    );
};

export const revokeAdminSessionsForAdmin = async (adminId: string) => {
    return AdminSession.updateMany(
        { adminId, revokedAt: { $exists: false } },
        { $set: { revokedAt: new Date() } }
    );
};
