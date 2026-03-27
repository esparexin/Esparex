"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export type AdminTabItem = {
    label: string;
    href: string;
    count?: number;
    matchPathOnly?: boolean;
};

const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");

type AdminModuleTabsProps = {
    tabs: AdminTabItem[];
    variant?: "primary" | "pills";
    className?: string;
};

export function AdminModuleTabs({ tabs, variant = "pills", className }: AdminModuleTabsProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const parsedTabs = tabs.map((tab) => {
        const url = new URL(tab.href, "https://admin.local");
        const tabParams = Array.from(url.searchParams.entries());
        const pathMatches = pathname === url.pathname;
        const paramsMatch = tab.matchPathOnly
            ? pathMatches
            : pathMatches && tabParams.every(([key, value]) => searchParams.get(key) === value);

        return {
            tab,
            url,
            tabParams,
            pathMatches,
            paramsMatch,
        };
    });

    return (
        <div className={cn("flex flex-wrap items-center", variant === "pills" ? "gap-2" : "gap-6 border-b border-slate-200 w-full", className)}>
            {parsedTabs.map(({ tab, url, tabParams, pathMatches, paramsMatch }) => {
                const hasMoreSpecificMatch =
                    tabParams.length === 0 &&
                    parsedTabs.some(
                        (candidate) =>
                            candidate.tab.href !== tab.href &&
                            candidate.pathMatches &&
                            candidate.tabParams.length > 0 &&
                            candidate.paramsMatch
                    );
                const isActive = paramsMatch && !(pathMatches && hasMoreSpecificMatch);

                const baseStyles = "inline-flex items-center gap-2 font-semibold uppercase tracking-[0.12em] transition-colors";
                
                const pillStyles = cn(
                    "rounded-full border px-3 py-2 text-xs",
                    isActive
                        ? "border-sky-200 bg-sky-50 text-sky-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                );

                const primaryStyles = cn(
                    "text-sm pb-3 border-b-2 -mb-[1px]",
                    isActive
                        ? "border-sky-600 text-sky-700"
                        : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                );

                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(baseStyles, variant === "pills" ? pillStyles : primaryStyles)}
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
