"use client";

import { ROLE_COLORS } from "@/components/system/adminUsers/adminUsers";

interface AdminUserRoleBadgeProps {
    role: string;
}

export function AdminUserRoleBadge({ role }: AdminUserRoleBadgeProps) {
    return (
        <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-tiny font-bold uppercase tracking-wider ${ROLE_COLORS[role] ?? "bg-slate-100 text-foreground-secondary"}`}
        >
            {role.replace(/_/g, " ")}
        </span>
    );
}
