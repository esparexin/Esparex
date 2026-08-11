"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { PageShell, Search, X } from "@esparex/ui";
import { AdminGlobalSearch } from "./AdminGlobalSearch";

export { AdminPagination } from "./AdminPagination";
export { AdminEmptyState } from "./AdminEmptyState";
export { AdminActionMenu } from "./AdminActionMenu";
export { MobileRowCard } from "./MobileRowCard";

const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");

type AdminPageShellProps = {
    title: string;
    description?: string;
    /** "compact" hides the description subtitle for dense operational screens (moderation, queues).
     *  Defaults to "default" — all existing screens unchanged. */
    headerVariant?: "default" | "compact";
    tabs?: ReactNode;
    filters?: ReactNode;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
    isNested?: boolean;
};

export function AdminPageShell({
    title,
    description,
    headerVariant = "default",
    tabs,
    filters,
    actions,
    children,
    className,
    isNested = false,
}: AdminPageShellProps) {
    const isCompact = headerVariant === "compact";
    const [floatingSearchOpen, setFloatingSearchOpen] = useState(false);

    return (
        <>
            <PageShell
                title={title}
                description={description}
                headerVariant={headerVariant}
                headerActions={actions}
                search={<AdminGlobalSearch />}
                tabs={tabs}
                filters={filters}
                className={className}
                isNested={isNested}
            >
                {children}
            </PageShell>

            {/* Floating Global Search Overlay */}
            {floatingSearchOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-20 backdrop-blur-sm"
                    onClick={() => setFloatingSearchOpen(false)}
                >
                    <div
                        className="w-full max-w-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative rounded-2xl bg-white shadow-2xl p-2">
                            <AdminGlobalSearch autoFocus onClose={() => setFloatingSearchOpen(false)} />
                            <div className="flex items-center justify-between px-3 pb-1 pt-2">
                                <p className="text-caption text-foreground-tertiary">Press ESC or click outside to close.</p>
                                <button
                                    type="button"
                                    onClick={() => setFloatingSearchOpen(false)}
                                    className="text-foreground-subtle hover:text-foreground-secondary"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Search Trigger FAB */}
            <button
                type="button"
                onClick={() => setFloatingSearchOpen(true)}
                className="fixed bottom-8 right-8 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg shadow-sky-200 hover:bg-sky-700 transition-all lg:hidden"
                aria-label="Open global search"
            >
                <Search size={20} />
            </button>
        </>
    );
}

