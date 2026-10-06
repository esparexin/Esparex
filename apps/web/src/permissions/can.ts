import { PERMISSIONS, type PermissionAction } from "./permissionMatrix";
import { Role, type User } from "@esparex/contracts";
import { normalizeRole } from "@esparex/shared";
import { isApprovedBusiness } from "@/guards/businessGuards";

export function can(
    action: PermissionAction,
    user: User | null | undefined
): boolean {
    if (!user) return false;

    // Platform system roles (admin, super_admin, moderator) bypass user business restrictions.
    // Canonical RBAC: route through identity-domain normalizeRole() + Role enum — no raw role strings.
    const role = normalizeRole(user.role);
    if (role === Role.ADMIN || role === Role.SUPER_ADMIN || role === Role.MODERATOR) {
        return true;
    }

    const definition = PERMISSIONS[action];
    if (!definition) return false;

    if (definition.requiresBusinessApproved) {
        return isApprovedBusiness(user);
    }

    return true;
}
