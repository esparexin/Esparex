import type { User } from "@/types/user";

export type ManagedUser = User & {
    totalAdsPosted?: number;
};

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

export function getUserStatusPresentation(status?: User["status"]) {
    switch (status) {
        case "suspended":
            return { status: "pending", label: "Suspended" };
        case "banned":
            return { status: "blocked", label: "Banned" };
        case "deleted":
            return { status: "deactivated", label: "Deleted" };
        case "active":
        default:
            return { status: "live", label: "Active" };
    }
}
