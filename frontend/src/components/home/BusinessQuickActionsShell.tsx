"use client";

import nextDynamic from "next/dynamic";

const BusinessQuickActions = nextDynamic(
    () => import("@/components/home/BusinessQuickActions").then((mod) => mod.BusinessQuickActions),
    {
        ssr: false,
        loading: () => (
            <div className="bg-white border-b border-slate-100 px-4 py-3 md:hidden">
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="flex-shrink-0 h-10 w-32 rounded-xl bg-slate-100 animate-pulse"
                        />
                    ))}
                </div>
            </div>
        ),
    }
);

export function BusinessQuickActionsShell() {
    return <BusinessQuickActions />;
}
