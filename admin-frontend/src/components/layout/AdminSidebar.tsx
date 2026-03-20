"use client";

import { useEffect, useMemo, useState } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { SidebarNavigation } from "./SidebarNavigation";
import { ADMIN_NAV_MODULES } from "./adminNavigation";
import { fetchAdminModerationSummary, fetchAdminServiceSummary } from "@/lib/api/moderation";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";

type SidebarCounters = Partial<Record<"ads" | "reports" | "businesses" | "services", string | number>>;

type AdminSidebarProps = {
    isMobileOpen: boolean;
    setIsMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isMinified: boolean;
    setIsMinified: React.Dispatch<React.SetStateAction<boolean>>;
};

export function AdminSidebar({ isMobileOpen, setIsMobileOpen, isMinified, setIsMinified }: AdminSidebarProps) {
    const { admin } = useAdminAuth();
    const [counts, setCounts] = useState<SidebarCounters>({});

    const hasAccess = (roles: string[]) => {
        if (!admin) return false;
        if (roles.includes("all")) return true;
        if (admin.role === "super_admin") return true;
        if (admin.role === "admin" && roles.includes("admin")) return true;
        if (admin.role === "moderator" && roles.includes("moderator")) return true;
        return false;
    };

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsMobileOpen(false);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            try {
                const [moderationSummary, serviceSummary, reportPayload, businessPayload] = await Promise.all([
                    fetchAdminModerationSummary().catch(() => null),
                    fetchAdminServiceSummary().catch(() => null),
                    adminFetch<any>(`${ADMIN_ROUTES.REPORTED_ADS}?${new URLSearchParams({ status: "open", page: "1", limit: "1" }).toString()}`).catch(() => null),
                    adminFetch<any>(`${ADMIN_ROUTES.BUSINESS_REQUESTS}?${new URLSearchParams({ status: "pending", page: "1", limit: "1" }).toString()}`).catch(() => null),
                ]);

                if (cancelled) return;

                const reportPagination = reportPayload ? parseAdminResponse<Record<string, unknown>>(reportPayload).pagination : undefined;
                const businessPagination = businessPayload ? parseAdminResponse<Record<string, unknown>>(businessPayload).pagination : undefined;

                setCounts({
                    ads: moderationSummary
                        ? `${moderationSummary.total} (P:${moderationSummary.pending}/L:${moderationSummary.live})`
                        : 0,
                    services: serviceSummary?.pending ?? 0,
                    reports: reportPagination?.total ?? 0,
                    businesses: businessPagination?.total ?? 0,
                });
            } catch {
                if (!cancelled) {
                    setCounts({});
                }
            }
        };

        void run();
        return () => {
            cancelled = true;
        };
    }, []);

    const visibleModules = useMemo(
        () => ADMIN_NAV_MODULES.filter((item) => hasAccess(item.roles)),
        [admin]
    );

    return (
        <>
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <button
                className="fixed bottom-6 right-6 z-50 rounded-full bg-primary p-4 text-white shadow-2xl transition-transform active:scale-95 lg:hidden"
                onClick={() => setIsMobileOpen((prev) => !prev)}
            >
                {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <aside
                className={`
                    fixed inset-y-0 left-0 z-40 flex w-[var(--sidebar-expanded)] flex-col border-r border-slate-800 bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out lg:hidden
                    ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-blue-500 font-bold text-white shadow-sm">
                            E
                        </div>
                        <span className="whitespace-nowrap text-xl font-bold tracking-tight text-white">
                            Esparex
                        </span>
                    </div>
                    <button
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                        onClick={() => setIsMobileOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <div className="px-4 pt-4">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Navigation</p>
                            <p className="mt-2 text-xs text-slate-400">
                                Modules consolidate filtered views into tabs and query-driven screens.
                            </p>
                        </div>
                    </div>

                    <SidebarNavigation items={visibleModules} counts={counts} />
                </div>

                <div className="border-t border-slate-800 px-4 py-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">v2.0.0-rc</span>
                        <span className="rounded-full bg-slate-800/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                            {admin?.role?.replace("_", " ")}
                        </span>
                    </div>
                </div>
            </aside>

            <aside
                className="relative z-20 hidden h-full shrink-0 flex-col border-r border-slate-800 bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-in-out lg:flex"
                style={{ width: "var(--sidebar-width)" }}
            >
                <div className={`flex h-16 shrink-0 items-center border-b border-slate-800 px-4 ${isMinified ? "justify-center" : "justify-between"}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-blue-500 font-bold text-white shadow-sm">
                            E
                        </div>
                        {!isMinified && (
                            <span className="whitespace-nowrap text-xl font-bold tracking-tight text-white">
                                Esparex
                            </span>
                        )}
                    </div>

                    {!isMinified ? (
                        <button
                            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                            onClick={() => setIsMinified(true)}
                            aria-label="Collapse sidebar"
                        >
                            <PanelLeftClose size={20} />
                        </button>
                    ) : (
                        <button
                            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                            onClick={() => setIsMinified(false)}
                            aria-label="Expand sidebar"
                        >
                            <PanelLeftOpen size={18} />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <div className="px-4 pt-4">
                        {!isMinified ? (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-3">
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Navigation</p>
                                <p className="mt-2 text-xs text-slate-400">
                                    Modules consolidate filtered views into tabs and query-driven screens.
                                </p>
                            </div>
                        ) : null}
                    </div>

                    <SidebarNavigation items={visibleModules} counts={counts} isMinified={isMinified} />
                </div>

                <div className={`border-t border-slate-800 px-4 py-4 ${isMinified ? "text-center" : ""}`}>
                    {!isMinified ? (
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">v2.0.0-rc</span>
                            <span className="rounded-full bg-slate-800/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                                {admin?.role?.replace("_", " ")}
                            </span>
                        </div>
                    ) : (
                        <span className="select-none text-[10px] font-bold tracking-widest text-slate-500">v2</span>
                    )}
                </div>
            </aside>
        </>
    );
}
