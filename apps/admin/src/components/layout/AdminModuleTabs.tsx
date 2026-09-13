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
        <div 
            role="tablist"
            className={cn("flex flex-wrap items-center", variant === "pills" ? "gap-2" : "gap-6 border-b border-border w-full", className)}
        >
            {parsedTabs.map(({ tab, url: _url, tabParams, pathMatches, paramsMatch }) => {
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

                const baseStyles = "inline-flex items-center gap-2 font-semibold uppercase tracking-[0.12em] transition-colors cursor-pointer";
                
                const pillStyles = cn(
                    "rounded-full border px-3 py-2 text-caption",
                    isActive
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground-tertiary hover:border-border/80 hover:text-foreground-secondary"
                );

                const primaryStyles = cn(
                    "text-body pb-3 border-b-2 -mb-[1px]",
                    isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-foreground-tertiary hover:text-foreground hover:border-border"
                );

                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        role="tab"
                        aria-selected={isActive}
                        className={cn(baseStyles, variant === "pills" ? pillStyles : primaryStyles)}
                    >
                        <span>{tab.label}</span>
                        {typeof tab.count === "number" && (
                            <span
                                className={cn(
                                    "rounded-full px-1.5 py-0.5 text-tiny",
                                    isActive ? "bg-primary/20 text-primary" : "bg-muted text-foreground-secondary"
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
