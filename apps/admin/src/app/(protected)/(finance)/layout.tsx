import type { ReactNode } from "react";
import { AdminRoleGuard } from "@/components/layout/AdminRoleGuard";

/**
 * Finance routes (invoices, plans, revenue) are restricted to
 * superAdmin and admin roles. Moderators are redirected to /dashboard.
 */
export default function FinanceLayout({ children }: { children: ReactNode }) {
    return <AdminRoleGuard>{children}</AdminRoleGuard>;
}
