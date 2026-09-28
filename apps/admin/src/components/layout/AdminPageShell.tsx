"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { PageShell, Search, X, Dialog, DialogContent, DialogDescription, DialogTitle } from "@esparex/ui";
import { AdminGlobalSearch } from "./AdminGlobalSearch";

export { AdminPagination } from "./AdminPagination";
export { AdminActionMenu } from "./AdminActionMenu";

type AdminPageShellProps = {
    title: string;
    description?: string;
    /** "compact" hides the description subtitle for dense operational screens (moderation, queues).
     *  Defaults to "default" — all existing screens unchanged. */
    headerVariant?: "default" | "compact";
    tabs?: ReactNode;
    filters?: ReactNode;
    actions?: ReactNode;
    showGlobalSearch?: boolean;
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
    showGlobalSearch = true,
    children,
    className,
    isNested = false,
}: AdminPageShellProps) {
    const [floatingSearchOpen, setFloatingSearchOpen] = useState(false);

    return (
        <>
            <PageShell
                title={title}
                description={description}
                headerVariant={headerVariant}
                headerActions={actions}
                search={showGlobalSearch ? <AdminGlobalSearch /> : null}
                tabs={tabs}
                filters={filters}
                className={className}
                isNested={isNested}
            >
                {children}
            </PageShell>

            {/* Floating Global Search Overlay (portalled Dialog: focus trap, ESC, overlay-dismiss) */}
            <Dialog open={floatingSearchOpen} onOpenChange={(nextOpen) => { if (!nextOpen) setFloatingSearchOpen(false); }}>
                <DialogContent className="max-w-xl bg-transparent border-none shadow-none p-4 items-start justify-center">
                    <DialogTitle className="sr-only">Global search</DialogTitle>
                    <DialogDescription className="sr-only">Search across admin sections. Press ESC or click outside to close.</DialogDescription>
                    <div className="w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="relative rounded-2xl bg-card shadow-2xl p-2 border border-border">
                            <AdminGlobalSearch autoFocus onClose={() => setFloatingSearchOpen(false)} />
                            <div className="flex items-center justify-between px-3 pb-1 pt-2">
                                <p className="text-caption text-foreground-tertiary">Press ESC or click outside to close.</p>
                                <button
                                    type="button"
                                    onClick={() => setFloatingSearchOpen(false)}
                                    className="text-foreground-subtle hover:text-foreground-secondary p-1 rounded-md"
                                    aria-label="Close search overlay"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Floating Search Trigger FAB */}
            <button
                type="button"
                onClick={() => setFloatingSearchOpen(true)}
                className="fixed bottom-20 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 lg:hidden"
                aria-label="Open global search"
            >
                <Search size={20} />
            </button>
        </>
    );
}


