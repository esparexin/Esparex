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
    default: "bg-sky-50 text-sky-600",
    info: "bg-sky-50 text-sky-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-rose-50 text-rose-600",
    success: "bg-emerald-50 text-emerald-600",
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
        <Card className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow ${className}`}>
            <CardContent className="p-0 space-y-4">
                <div className="flex items-start justify-between">
                    <div className={`p-2.5 rounded-xl ${iconStyle}`}>
                        <Icon size={22} />
                    </div>
                    {trend && (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend.isUp ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                            }`}>
                            {trend.isUp ? "+" : "-"}{trend.value}%
                        </span>
                    )}
                </div>
                <div>
                    <p className="text-sm font-medium text-foreground-tertiary mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-foreground tracking-tight">{value}</h3>
                    {description && (
                        <p className="mt-2 text-xs text-foreground-subtle font-medium italic">{description}</p>
                    )}
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

