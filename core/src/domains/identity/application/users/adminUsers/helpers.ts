import { USER_STATUS, Role } from '@esparex/contracts';
import { normalizeUserStatus } from '@esparex/shared';

const ACTIVE_USER_STATUS_QUERY = { $in: [USER_STATUS.ACTIVE, USER_STATUS.LIVE] };
const ADMIN_ROLE_RANK: Record<string, number> = { [Role.MODERATOR]: 40, [Role.ADMIN]: 70, [Role.SUPER_ADMIN]: 100 };
export const ALLOWED_ADMIN_ROLES = new Set([Role.SUPER_ADMIN, Role.ADMIN, Role.MODERATOR]);

export const getRoleRank = (role: string | undefined): number => ADMIN_ROLE_RANK[role || ''] || 0;

export const ensureRoleAssignmentAllowed = (actorRole: string | undefined, targetRole: string): boolean => {
    if (!actorRole) return false;
    if (actorRole === Role.SUPER_ADMIN) return true;
    return getRoleRank(targetRole) <= getRoleRank(actorRole);
};

export const buildUserStatusFilter = (status?: string) => {
    if (!status || status === 'all') return undefined;
    const normalizedStatus = normalizeUserStatus(status);
    const rawStatus = typeof status === 'string' ? status.toLowerCase() : '';
    if (rawStatus === USER_STATUS.LIVE || rawStatus === USER_STATUS.ACTIVE) {
        return { $in: [USER_STATUS.ACTIVE, USER_STATUS.LIVE] };
    }
    return normalizedStatus ?? status;
};

export const normalizeAdminManagedUser = (input: unknown): Record<string, unknown> => {
    const rawObj = (input && typeof input === 'object') ? (input as { toObject?: () => Record<string, unknown> }) : {};
    const p: Record<string, unknown> = typeof rawObj.toObject === 'function' ? rawObj.toObject() : { ...rawObj };
    const ns = normalizeUserStatus(p.status as string | undefined);
    if (ns) p.status = ns;
    return p;
};

export { ACTIVE_USER_STATUS_QUERY };

