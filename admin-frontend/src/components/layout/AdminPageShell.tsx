"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Search, X } from "lucide-react";
import { AdminGlobalSearch } from "./AdminGlobalSearch";

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
}: AdminPageShellProps) {
    const isCompact = headerVariant === "compact";
    const [floatingSearchOpen, setFloatingSearchOpen] = useState(false);

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            <header className="shrink-0 space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
                        {!isCompact && description && (
                            <p className="mt-1 text-sm text-slate-500">{description}</p>
                        )}
                    </div>
                    {!isCompact && (
                        <div className="hidden flex-1 md:block max-w-xl mx-4">
                            <AdminGlobalSearch />
                        </div>
                    )}
                    {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
                </div>
                {tabs}
                {filters}
            </header>
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>

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
                                <p className="text-xs text-slate-400">Press ESC or click outside to close.</p>
                                <button
                                    type="button"
                                    onClick={() => setFloatingSearchOpen(false)}
                                    className="text-slate-400 hover:text-slate-700"
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
                className={cn(
                    "fixed bottom-8 right-8 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg shadow-sky-200 hover:bg-sky-700 transition-all",
                    !isCompact && "md:hidden"
                )}
                aria-label="Open global search"
            >
                <Search size={20} />
            </button>
        </div>
    );
}
