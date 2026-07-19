import { USER_STATUS, Role } from '@esparex/contracts';
import { normalizeUserStatus } from '@esparex/shared';

const ACTIVE_USER_STATUS_QUERY = USER_STATUS.LIVE;
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
    return normalizedStatus === USER_STATUS.LIVE ? USER_STATUS.LIVE : normalizedStatus ?? status;
};

export const normalizeAdminManagedUser = <T extends Record<string, unknown>>(input: T): T => {
    const p: Record<string, unknown> = typeof (input as any).toObject === 'function' ? (input as any).toObject() : { ...input };
    const ns = normalizeUserStatus(p.status as string | undefined);
    if (ns) p.status = ns;
    return p as T;
};

export { ACTIVE_USER_STATUS_QUERY };
