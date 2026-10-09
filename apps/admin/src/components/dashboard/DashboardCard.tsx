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
    default: "bg-primary-subtle text-primary border border-primary/20",
    info: "bg-primary-subtle text-primary border border-primary/20",
    warning: "bg-warning/10 text-warning-dark border border-warning/20",
    danger: "bg-destructive/10 text-destructive border border-destructive/20",
    success: "bg-success/10 text-success-dark border border-success/20",
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
        <Card className={`bg-card px-3 py-2.5 rounded-xl border border-border shadow-sm hover:shadow-sm transition-all hover:border-border/80 ${className}`}>
            <CardContent className="p-0 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <p className="text-tiny font-bold text-foreground-tertiary uppercase tracking-wider truncate mb-0.5">{title}</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-body-lg font-bold text-foreground tracking-tight">{value}</span>
                        {description && (
                            <span className="text-tiny text-foreground-subtle font-medium italic truncate">{description}</span>
                        )}
                        {trend && (
                            <span className={`text-tiny font-semibold ${trend.isUp ? "text-success" : "text-destructive"}`}>
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

