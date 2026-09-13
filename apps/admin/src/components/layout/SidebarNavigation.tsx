"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminModuleItem } from "./adminNavigation";

const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");

type SidebarNavigationProps = {
    items: AdminModuleItem[];
    counts?: Partial<Record<"ads" | "reports" | "businesses" | "services", number | string>>;
    isMinified?: boolean;
};

export function SidebarNavigation({ items, counts, isMinified = false }: SidebarNavigationProps) {
    const pathname = usePathname();

    // Group items by section
    const sections = useMemo(() => {
        const groups: Record<string, AdminModuleItem[]> = {};
        items.forEach((item) => {
            const section = item.section || "General";
            if (!groups[section]) groups[section] = [];
            groups[section].push(item);
        });
        return groups;
    }, [items]);

    return (
        <nav className="space-y-4 px-3 py-3">
            {Object.entries(sections).map(([sectionName, sectionItems]) => (
                <div key={sectionName} className="space-y-1.5">
                    {!isMinified && sectionName !== "General" && (
                        <h3 className="px-3 text-tiny font-bold uppercase tracking-[0.14em] text-foreground-subtle mb-2">
                            {sectionName}
                        </h3>
                    )}
                    <div className="space-y-1">
                        {sectionItems.map((item) => {
                            const hrefBase = item.href.split("?")[0];
                            const aliases = item.aliases || [];
                            const isActive =
                                pathname === hrefBase ||
                                pathname.startsWith(`${hrefBase}/`) ||
                                aliases.some((alias) => pathname === alias || pathname.startsWith(`${alias}/`));
                            const counter = item.counterKey ? counts?.[item.counterKey] : undefined;

                            return (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    className={cn(
                                        "group relative flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-200",
                                        isMinified ? "justify-center" : "justify-between",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-xs"
                                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                    )}
                                >
                                    <div className={cn("flex items-center gap-3 min-w-0", isMinified && "justify-center")}>
                                        <item.icon
                                            size={20}
                                            className={cn(
                                                "shrink-0",
                                                isActive ? "text-primary-foreground" : "text-foreground-subtle group-hover:text-sidebar-foreground"
                                            )}
                                        />
                                        {!isMinified && (
                                            <span className={cn("truncate text-body font-medium", isActive ? "text-primary-foreground" : "text-sidebar-foreground")}>
                                                {item.label}
                                            </span>
                                        )}
                                    </div>

                                    {!isMinified && counter !== undefined && (typeof counter === "string" || counter > 0) && (
                                        <span
                                            className={cn(
                                                "rounded-full px-2 py-0.5 text-tiny font-bold uppercase tracking-[0.14em] whitespace-nowrap",
                                                isActive ? "bg-white/15 text-white" : "bg-sidebar-accent text-sidebar-foreground/80"
                                            )}
                                        >
                                            {counter}
                                        </span>
                                    )}

                                    {isMinified && (
                                        <div className="absolute left-14 hidden items-center z-50 group-hover:flex animate-in slide-in-from-left-2 duration-150">
                                            <div className="rounded-md border border-sidebar-border bg-sidebar px-3 py-2 text-caption font-semibold text-sidebar-foreground shadow-xl whitespace-nowrap">
                                                {item.label}
                                                {typeof counter === "number" && counter > 0 ? ` (${counter})` : ""}
                                            </div>
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ))}
        </nav>
    );
}
