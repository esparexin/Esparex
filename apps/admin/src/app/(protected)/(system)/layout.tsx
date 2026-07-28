"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";

import { Role } from "@esparex/contracts";
import { isSuperAdminRole } from "@esparex/core/utils/roleNormalization";

/**
 * System-level routes (admin-users, api-keys, audit-logs, settings, etc.)
 * are restricted to superAdmin and admin roles only.
 * Moderators are redirected to /dashboard.
 */
export default function SystemLayout({ children }: { children: ReactNode }) {
    const { admin, loading } = useAdminAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (!admin) return; // AdminRouteGuard in parent layout handles unauthenticated redirect

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
