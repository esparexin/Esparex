import {
    CHAT_STATUS,
    LIFECYCLE_STATUS,
    USER_STATUS,
    isActiveUserStatus,
    normalizeUserStatus,
    type User,
} from "@shared";

export type ManagedUser = User & {
    totalAdsPosted?: number;
};

export type UserManagementStatusFilter =
    | "all"
    | typeof USER_STATUS.LIVE
    | typeof USER_STATUS.SUSPENDED
    | typeof USER_STATUS.BANNED;

export type UserActionType = "suspend" | "ban" | "activate" | "verify" | "unverify";

export type UserActionState = {
    isOpen: boolean;
    type: UserActionType;
    user: ManagedUser | null;
};

export const DEFAULT_USER_ACTION_STATE: UserActionState = {
    isOpen: false,
    type: "suspend",
    user: null,
};

export function getUserDisplayName(user: Pick<User, "name" | "mobile" | "email">) {
    return user.name || user.mobile || user.email || "Unknown";
}

export function normalizeManagedUserStatus(status?: User["status"]) {
    return normalizeUserStatus(status) ?? USER_STATUS.LIVE;
}

export function isManagedUserActive(status?: User["status"]) {
    return isActiveUserStatus(status);
}

export function normalizeUserManagementStatusFilter(
    value: string | null | undefined
): UserManagementStatusFilter {
    if (value === CHAT_STATUS.ACTIVE) return USER_STATUS.LIVE;
    if (value === CHAT_STATUS.BLOCKED) return USER_STATUS.BANNED;
    if (value === USER_STATUS.LIVE || value === USER_STATUS.SUSPENDED || value === USER_STATUS.BANNED) return value;
    return "all";
}

export function normalizeManagedUser(user: ManagedUser): ManagedUser {
    return {
        ...user,
        status: normalizeManagedUserStatus(user.status),
    };
}

export function getUserStatusPresentation(status?: User["status"]) {
    switch (normalizeManagedUserStatus(status)) {
        case USER_STATUS.SUSPENDED:
            return { status: LIFECYCLE_STATUS.PENDING, label: "Suspended" };
        case USER_STATUS.BANNED:
            return { status: CHAT_STATUS.BLOCKED, label: "Banned" };
        case "deleted":
            return { status: LIFECYCLE_STATUS.DEACTIVATED, label: "Deleted" };
        case USER_STATUS.INACTIVE:
            return { status: LIFECYCLE_STATUS.DEACTIVATED, label: "Inactive" };
        case USER_STATUS.LIVE:
        default:
            return { status: LIFECYCLE_STATUS.LIVE, label: "Active" };
    }
}
