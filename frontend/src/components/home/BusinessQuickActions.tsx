"use client";

import Link from "next/link";
import { PlusCircle, Wrench, CircuitBoard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/hooks/useBusiness";

const ACTIONS = [
    {
        label: "Post Ad",
        href: "/post-ad",
        icon: PlusCircle,
        className: "bg-blue-50 text-blue-700 border-blue-100",
    },
    {
        label: "Post Service",
        href: "/post-service",
        icon: Wrench,
        className: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    {
        label: "Post Spare Part",
        href: "/post-spare-part-listing",
        icon: CircuitBoard,
        className: "bg-violet-50 text-violet-700 border-violet-100",
    },
];

export function BusinessQuickActions() {
    const { user, status } = useAuth();
    const { businessData, isFetched } = useBusiness(user);

    // Only render for authenticated, verified business accounts
    if (status !== "authenticated" || !isFetched) return null;
    if (businessData?.status !== "live") return null;

    return (
        <div className="bg-white border-b border-slate-100 px-4 py-3 md:hidden">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Quick Actions
            </p>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                {ACTIONS.map(({ label, href, icon: Icon, className }) => (
                    <Link
                        key={href}
                        href={href}
                        className={`flex-shrink-0 flex items-center gap-2 h-11 px-4 rounded-xl border font-bold text-xs transition-colors active:scale-[0.97] ${className}`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </Link>
                ))}
            </div>
        </div>
    );
}
