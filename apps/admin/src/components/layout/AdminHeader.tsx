"use client";

import { useMemo } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Bell, LogOut, ShieldCheck, Menu } from "@esparex/ui";

interface AdminHeaderProps {
    onMobileMenuClick?: () => void;
}

export function AdminHeader({ onMobileMenuClick }: AdminHeaderProps = {}) {
    const { admin, logout } = useAdminAuth();

    const todayLabel = useMemo(
        () =>
            new Intl.DateTimeFormat("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
            }).format(new Date()),
        []
    );

    return (
        <header className="sticky top-0 z-30 shrink-0 border-b border-border/80 bg-background/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-2.5 lg:px-8">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        type="button"
                        onClick={onMobileMenuClick}
                        className="lg:hidden p-1 text-foreground-secondary hover:text-foreground transition-colors"
                        aria-label="Open navigation menu"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-tiny font-semibold uppercase tracking-[0.14em] text-sky-700">
                        <ShieldCheck size={13} />
                        <span>Admin Console</span>
                    </div>
                    <span className="hidden sm:inline-block text-xs font-medium text-foreground-subtle border-l border-slate-200 pl-3">
                        {todayLabel}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        className="relative rounded-full border border-border bg-card p-2 text-foreground-tertiary shadow-xs transition-colors hover:bg-accent hover:text-foreground"
                        aria-label="Notifications"
                    >
                        <Bell size={18} />
                        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-card bg-rose-500" />
                    </button>

                    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-1.5 shadow-xs">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-semibold leading-tight text-foreground">
                                {admin?.firstName} {admin?.lastName}
                            </p>
                            <span className="mt-0.5 inline-flex rounded-full bg-muted px-2 py-0.5 text-tiny font-bold uppercase tracking-[0.12em] text-foreground-secondary">
                                {admin?.role}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => void logout()}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground-secondary transition-all hover:bg-rose-50 hover:text-rose-600"
                            title="Logout"
                            aria-label="Logout"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}

