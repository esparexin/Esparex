"use client";

import type { ReactNode } from "react";

export function CatalogEntityCell({
    icon, iconClassName, title, subtitle,
}: {
    icon: ReactNode; iconClassName: string; title: ReactNode; subtitle?: ReactNode;
}) {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconClassName}`}>{icon}</div>
            <div>
                <div className="font-bold text-slate-900">{title}</div>
                {subtitle ? <div className="text-xs text-slate-500">{subtitle}</div> : null}
            </div>
        </div>
    );
}
