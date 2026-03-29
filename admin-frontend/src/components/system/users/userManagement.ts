import type { User } from "@/types/user";
import { USER_STATUS } from "@shared/enums/userStatus";
import { isActiveUserStatus, normalizeUserStatus } from "@shared/utils/userStatus";

export type ManagedUser = User & {
    totalAdsPosted?: number;
};

export type UserManagementStatusFilter = "all" | "live" | "suspended" | "banned";

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
    if (value === "active") return "live";
    if (value === "blocked") return "banned";
    if (value === "live" || value === "suspended" || value === "banned") return value;
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
        case "suspended":
            return { status: "pending", label: "Suspended" };
        case "banned":
            return { status: "blocked", label: "Banned" };
        case "deleted":
            return { status: "deactivated", label: "Deleted" };
        case "inactive":
            return { status: "deactivated", label: "Inactive" };
        case "live":
        default:
            return { status: "live", label: "Active" };
    }
}
