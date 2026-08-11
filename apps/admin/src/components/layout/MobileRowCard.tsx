"use client";

import React from "react";

export type MobileRowCardItem = {
    label: string;
    value: React.ReactNode;
};

export type MobileRowCardProps = {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    badge?: React.ReactNode;
    fields: MobileRowCardItem[];
    actions?: React.ReactNode;
    onClick?: () => void;
    className?: string;
};

const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");

export function MobileRowCard({
    title,
    subtitle,
    badge,
    fields,
    actions,
    onClick,
    className,
}: MobileRowCardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-shadow hover:shadow-md",
                onClick && "cursor-pointer active:bg-slate-50/80",
                className
            )}
        >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-foreground truncate">{title}</div>
                    {subtitle && <div className="text-xs text-foreground-tertiary mt-0.5">{subtitle}</div>}
                </div>
                {badge && <div className="shrink-0">{badge}</div>}
            </div>

            {fields.length > 0 && (
                <div className="grid grid-cols-2 gap-2 py-3 text-xs">
                    {fields.map((field, idx) => (
                        <div key={idx} className="space-y-0.5">
                            <span className="text-tiny font-medium text-foreground-tertiary uppercase tracking-wider">
                                {field.label}
                            </span>
                            <div className="font-medium text-foreground text-xs truncate">{field.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {actions && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}
