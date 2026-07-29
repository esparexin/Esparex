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
                <div className="font-bold text-foreground">{title}</div>
                {subtitle ? <div className="text-xs text-foreground-tertiary">{subtitle}</div> : null}
            </div>
        </div>
    );
}
