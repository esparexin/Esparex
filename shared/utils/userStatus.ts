import { USER_STATUS, USER_STATUS_VALUES, type UserStatusValue } from "../enums/userStatus";

const validUserStatuses = new Set<string>(USER_STATUS_VALUES);

export type UserStatusLike = UserStatusValue | "active" | string | null | undefined;

export function normalizeUserStatus(status: UserStatusLike): UserStatusValue | undefined {
    if (typeof status !== "string") {
        return undefined;
    }

    return validUserStatuses.has(status) ? (status as UserStatusValue) : undefined;
}

export function isActiveUserStatus(status: UserStatusLike): boolean {
    return normalizeUserStatus(status) === USER_STATUS.LIVE;
}
