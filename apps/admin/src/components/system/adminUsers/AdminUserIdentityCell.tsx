"use client";

import type { ManagedAdmin } from "@/components/system/adminUsers/adminUsers";
import { getAdminDisplayName } from "@/components/system/adminUsers/adminUsers";

interface AdminUserIdentityCellProps {
    admin: ManagedAdmin;
}

export function AdminUserIdentityCell({ admin }: AdminUserIdentityCellProps) {
    return (
        <div>
            <div className="font-semibold text-slate-900">{getAdminDisplayName(admin)}</div>
            <div className="text-xs text-slate-500">{admin.email}</div>
        </div>
    );
}
