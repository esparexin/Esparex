"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";

/**
 * Finance routes (invoices, plans, revenue) are restricted to
 * super_admin and admin roles. Moderators are redirected to /dashboard.
 */
export default function FinanceLayout({ children }: { children: React.ReactNode }) {
    const { admin, loading } = useAdminAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (!admin) return;

        const isAllowed = admin.role === "super_admin" || admin.role === "admin";
        if (!isAllowed) {
            router.replace("/dashboard");
        }
    }, [admin, loading, router]);

    if (loading) return null;
    if (!admin) return null;

    const isAllowed = admin.role === "super_admin" || admin.role === "admin";
    if (!isAllowed) return null;

    return <>{children}</>;
}
