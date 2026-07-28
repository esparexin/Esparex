import type { ReactNode } from "react";
import { AdminRoleGuard } from "@/components/layout/AdminRoleGuard";

/**
 * System-level routes (admin-users, api-keys, audit-logs, settings, etc.)
 * are restricted to superAdmin and admin roles only.
 * Moderators are redirected to /dashboard.
 */
export default function SystemLayout({ children }: { children: ReactNode }) {
    return <AdminRoleGuard>{children}</AdminRoleGuard>;
}
