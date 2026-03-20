import { PERMISSIONS } from "./permissionMatrix";
import type { User } from "@/types/User";

export function can(
    action: keyof typeof PERMISSIONS,
    user: User
): boolean {
    const rule = PERMISSIONS[action];
    type PermissionRule = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

    if (!rule) return false;

    const check = rule[user.role as keyof PermissionRule];
    if (typeof check === "function") {
        // If it's a function, pass businessStatus
        return check(user.businessStatus || "pending");
    }

    return Boolean(check);
}
