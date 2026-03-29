import { USER_STATUS, USER_STATUS_VALUES, type UserStatusValue } from "../enums/userStatus";

const LEGACY_ACTIVE_STATUS = "active";
const validUserStatuses = new Set<string>(USER_STATUS_VALUES);

export type UserStatusLike = UserStatusValue | typeof LEGACY_ACTIVE_STATUS | string | null | undefined;

export function normalizeUserStatus(status: UserStatusLike): UserStatusValue | undefined {
    if (status === LEGACY_ACTIVE_STATUS) {
        return USER_STATUS.LIVE;
    }

    if (typeof status !== "string") {
        return undefined;
    }

    return validUserStatuses.has(status) ? (status as UserStatusValue) : undefined;
}

export function isActiveUserStatus(status: UserStatusLike): boolean {
    return normalizeUserStatus(status) === USER_STATUS.LIVE;
}
