import { PERMISSIONS, type PermissionAction } from "./permissionMatrix";
import type { User } from "@/types/User";
import { isApprovedBusiness } from "@/guards/businessGuards";

export function can(
    action: PermissionAction,
    user: User | null | undefined
): boolean {
    if (!user) return false;

    // Platform system roles (admin, super_admin, moderator) bypass user business restrictions
    const roleLower = String(user.role || "").toLowerCase();
    if (roleLower === "admin" || roleLower === "super_admin" || roleLower === "superadmin" || roleLower === "moderator") {
        return true;
    }

    const definition = PERMISSIONS[action];
    if (!definition) return false;

    if (definition.requiresBusinessApproved) {
        return isApprovedBusiness(user);
    }

    return true;
}
