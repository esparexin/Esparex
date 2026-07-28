"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";

import { Role } from "@esparex/contracts";
import { isSuperAdminRole } from "@esparex/shared";

/**
 * Finance routes (invoices, plans, revenue) are restricted to
 * superAdmin and admin roles. Moderators are redirected to /dashboard.
 */
export default function FinanceLayout({ children }: { children: ReactNode }) {
    const { admin, loading } = useAdminAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (!admin) return;

        const isAllowed = isSuperAdminRole(admin.role) || admin.role === "superAdmin" || admin.role === Role.ADMIN;
        if (!isAllowed) {
            router.replace("/dashboard");
        }
    }, [admin, loading, router]);

    if (loading) return null;
    if (!admin) return null;

    const isAllowed = isSuperAdminRole(admin.role) || admin.role === "superAdmin" || admin.role === Role.ADMIN;
    if (!isAllowed) return null;

    return <>{children}</>;
}
