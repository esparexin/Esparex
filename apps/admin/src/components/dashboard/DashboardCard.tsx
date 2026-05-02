"use client";

import { LucideIcon } from "lucide-react";
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
    className?: string;
    href?: string;
}

export function DashboardCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    className = "",
    href
}: DashboardCardProps) {
    const content = (
        <div className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow ${className}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Icon size={24} />
                </div>
                {trend && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend.isUp ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}>
                        {trend.isUp ? "+" : "-"}{trend.value}%
                    </span>
                )}
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
                {description && (
                    <p className="mt-2 text-xs text-slate-400 font-medium italic">{description}</p>
                )}
            </div>
        </div>
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
