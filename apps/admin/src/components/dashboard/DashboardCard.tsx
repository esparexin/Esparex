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
        <Card className={`bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow ${className}`}>
            <CardContent className="p-0 space-y-2">
                <div className="flex items-center justify-between">
                    <div className={`p-1.5 rounded-md ${iconStyle}`}>
                        <Icon size={18} />
                    </div>
                    {trend && (
                        <span className={`text-tiny font-semibold px-1.5 py-0.5 rounded-full ${trend.isUp ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                            }`}>
                            {trend.isUp ? "+" : "-"}{trend.value}%
                        </span>
                    )}
                </div>
                <div>
                    <p className="text-xs font-semibold text-foreground-tertiary mb-0.5">{title}</p>
                    <h3 className="text-lg font-bold text-foreground tracking-tight">{value}</h3>
                    {description && (
                        <p className="mt-1 text-tiny text-foreground-subtle font-medium italic">{description}</p>
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

