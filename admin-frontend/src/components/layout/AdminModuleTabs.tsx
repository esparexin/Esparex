"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export type AdminTabItem = {
    label: string;
    href: string;
    count?: number;
};

const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");

type AdminModuleTabsProps = {
    tabs: AdminTabItem[];
    className?: string;
};

export function AdminModuleTabs({ tabs, className }: AdminModuleTabsProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentQuery = searchParams.toString();

    return (
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
            {tabs.map((tab) => {
                const url = new URL(tab.href, "https://admin.local");
                
                // Smarter active detection:
                // 1. Path must match
                // 2. All query params in the tab.href MUST be present in the current URL
                const pathMatches = pathname === url.pathname;
                const tabParams = Array.from(url.searchParams.entries());
                const paramsMatch = tabParams.every(([key, value]) => searchParams.get(key) === value);
                
                const isActive = pathMatches && paramsMatch;

                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                            "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors",
                            isActive
                                ? "border-sky-200 bg-sky-50 text-sky-700"
                                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                        )}
                    >
                        <span>{tab.label}</span>
                        {typeof tab.count === "number" && (
                            <span
                                className={cn(
                                    "rounded-full px-1.5 py-0.5 text-[10px]",
                                    isActive ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600"
                                )}
                            >
                                {tab.count}
                            </span>
                        )}
                    </Link>
                );
            })}
        </div>
    );
}
