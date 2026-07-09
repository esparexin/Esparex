"use client";

import type { ReactNode } from "react";

export function CatalogActionIconButton({
    onClick,
    icon,
    title,
    className,
}: {
    onClick: () => void;
    icon: ReactNode;
    title: string;
    className: string;
}) {
    return (
        <button type="button" onClick={onClick} className={`shrink-0 ${className}`.trim()} title={title}>
            {icon}
        </button>
    );
}

export function CatalogActionsRow({ children }: { children: ReactNode }) {
    return <div className="flex flex-wrap items-center justify-end gap-2">{children}</div>;
}
