"use client";

import { ROLE_COLORS } from "@/components/system/adminUsers/adminUsers";

interface AdminUserRoleBadgeProps {
    role: string;
}

export function AdminUserRoleBadge({ role }: AdminUserRoleBadgeProps) {
    return (
        <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ROLE_COLORS[role] ?? "bg-slate-100 text-slate-600"}`}
        >
            {role.replace(/_/g, " ")}
        </span>
    );
}
