"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Role } from "@esparex/contracts";
import { isSuperAdminRole } from "@esparex/shared";

interface AdminRoleGuardProps {
    children: ReactNode;
    allowedRoles?: Array<Role | string>;
    fallbackPath?: string;
}

export function AdminRoleGuard({
    children,
    allowedRoles = [Role.SUPER_ADMIN, Role.ADMIN],
    fallbackPath = "/dashboard",
}: AdminRoleGuardProps) {
    const { admin, loading } = useAdminAuth();
    const router = useRouter();

    const isAllowed = Boolean(
        admin && (
            isSuperAdminRole(admin.role) ||
            allowedRoles.includes(admin.role as Role) ||
            allowedRoles.includes("superAdmin")
        )
    );

    useEffect(() => {
        if (loading || !admin) return;
        if (!isAllowed) {
            router.replace(fallbackPath);
        }
    }, [admin, loading, isAllowed, router, fallbackPath]);

    if (loading || !admin || !isAllowed) return null;

    return <>{children}</>;
}
