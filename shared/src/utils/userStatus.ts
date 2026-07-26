import { USER_STATUS, type UserStatusValue } from "@esparex/contracts";
import { normalizeUserStatus as canonicalNormalizeUserStatus } from "./statusNormalization";

export type UserStatusLike = UserStatusValue | "active" | string | null | undefined;

export function isActiveUserStatus(status: UserStatusLike): boolean {
    const normalized = canonicalNormalizeUserStatus(status);
    return normalized === 'active' || status === USER_STATUS.LIVE;
}


