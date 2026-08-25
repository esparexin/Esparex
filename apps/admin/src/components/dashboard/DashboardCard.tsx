"use client";

import { Card, CardContent, type LucideIcon } from "@esparex/ui";
import Link from "next/link";

interface DashboardCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: {
        value: number;
        isUp: boolean;
    };
    variant?: "default" | "warning" | "danger" | "success" | "info";
    className?: string;
    href?: string;
}

const variantStyles: Record<NonNullable<DashboardCardProps["variant"]>, string> = {
    default: "bg-sky-50 text-sky-700 border border-sky-100",
    info: "bg-sky-50 text-sky-700 border border-sky-100",
    warning: "bg-amber-50 text-amber-800 border border-amber-100",
    danger: "bg-rose-50 text-rose-700 border border-rose-100",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
};

export function DashboardCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    variant = "default",
    className = "",
    href
}: DashboardCardProps) {
    const iconStyle = variantStyles[variant] || variantStyles.default;
    const content = (
        <Card className={`bg-white px-3 py-2.5 rounded-xl border border-slate-200 shadow-xs hover:shadow-sm transition-all hover:border-slate-300 ${className}`}>
            <CardContent className="p-0 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <p className="text-tiny font-bold text-foreground-tertiary uppercase tracking-wider truncate mb-0.5">{title}</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold text-foreground tracking-tight">{value}</span>
                        {description && (
                            <span className="text-tiny text-foreground-subtle font-medium italic truncate">{description}</span>
                        )}
                        {trend && (
                            <span className={`text-tiny font-semibold ${trend.isUp ? "text-emerald-600" : "text-rose-600"}`}>
                                {trend.isUp ? "↑" : "↓"} {trend.value}%
                            </span>
                        )}
                    </div>
                </div>
                <div className={`p-1.5 rounded-lg shrink-0 ${iconStyle}`}>
                    <Icon size={16} />
                </div>
            </CardContent>
        </Card>
    );

    if (href) {
        return (
            <Link href={href} className="block transition-transform hover:-translate-y-0.5">
                {content}
            </Link>
        );
    }

    return content;
}

