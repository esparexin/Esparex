"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "@esparex/ui";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useAdminSidebarCounts } from "@/hooks/useAdminSidebarCounts";
import { SidebarNavigation } from "./SidebarNavigation";
import { ADMIN_NAV_MODULES } from "./adminNavigation";

type AdminSidebarProps = {
    isMobileOpen: boolean;
    setIsMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isMinified: boolean;
    setIsMinified: React.Dispatch<React.SetStateAction<boolean>>;
};

function SidebarFooterMeta({ role }: { role?: string }) {
    const formattedRole = role === "superAdmin" 
        ? "super admin" 
        : role?.replace("_", " ") || "";
    return (
        <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-subtle">v2.0.0-rc</span>
            <span className="rounded-full bg-slate-800/50 px-2 py-0.5 text-tiny font-bold uppercase tracking-widest text-foreground-subtle">
                {formattedRole}
            </span>
        </div>
    );
}

import { cn } from "@esparex/ui";
import { isSuperAdminRole } from "@esparex/shared";

import Image from "next/image";

export function AdminSidebar({ isMobileOpen, setIsMobileOpen, isMinified, setIsMinified }: AdminSidebarProps) {
    const { admin } = useAdminAuth();
    const counts = useAdminSidebarCounts();

    const hasAccess = useCallback((roles: string[]) => {
        if (!admin) return false;
        if (roles.includes("all")) return true;
        if (isSuperAdminRole(admin.role) || admin.role === "superAdmin") return true;
        if (admin.role === "admin" && roles.includes("admin")) return true;
        if (admin.role === "moderator" && roles.includes("moderator")) return true;
        return false;
    }, [admin]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsMobileOpen(false);
            }
            if (window.innerWidth >= 1024 && window.innerWidth < 1280) {
                setIsMinified(true);
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [setIsMobileOpen, setIsMinified]);

    const sidebarRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const el = sidebarRef.current;
        if (!el) return;
        if (isMobileOpen) {
            el.removeAttribute("inert");
        } else {
            // Apply inert on mobile view when closed
            if (window.innerWidth < 1024) {
                el.setAttribute("inert", "");
            } else {
                el.removeAttribute("inert");
            }
        }
    }, [isMobileOpen]);

    const visibleModules = useMemo(
        () => ADMIN_NAV_MODULES.filter((item) => hasAccess(item.roles)),
        [hasAccess]
    );

    return (
        <>
            <div
                className={cn(
                    "fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden",
                    isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsMobileOpen(false)}
                aria-hidden="true"
            />

            <button
                className="fixed bottom-6 right-6 z-50 rounded-full bg-primary p-4 text-white shadow-2xl transition-transform active:scale-95 lg:hidden"
                onClick={() => setIsMobileOpen((prev) => !prev)}
            >
                {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <aside
                ref={sidebarRef}
                className={cn(
                    "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-800 bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
                    isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full w-64",
                    "lg:relative lg:z-20 lg:h-full lg:shrink-0 lg:translate-x-0",
                    isMinified ? "lg:w-16" : "lg:w-64"
                )}
            >
                <div className={cn("flex h-14 shrink-0 items-center border-b border-slate-800 px-4", isMinified ? "lg:justify-center justify-between" : "justify-between")}>
                    <div className="flex items-center gap-2.5 overflow-hidden">
                        <Image
                            src="/icons/logo.png"
                            alt="Esparex Logo"
                            width={130}
                            height={32}
                            priority
                            className={cn("h-7 w-auto object-contain", isMinified && "lg:hidden")}
                        />
                        {isMinified && (
                            <span className="hidden lg:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 font-extrabold text-white shadow-sm text-sm">
                                E
                            </span>
                        )}
                    </div>

                    <div className="flex items-center">
                        <button
                            className="lg:hidden rounded-md p-1.5 text-foreground-subtle transition-colors hover:bg-slate-800 hover:text-white"
                            onClick={() => setIsMobileOpen(false)}
                        >
                            <X size={20} />
                        </button>
                        
                        <button
                            className={cn("hidden lg:flex rounded-md p-1.5 text-foreground-subtle transition-colors hover:bg-slate-800 hover:text-white", isMinified && "h-9 w-9 items-center justify-center")}
                            onClick={() => setIsMinified(!isMinified)}
                            aria-label={isMinified ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            {isMinified ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={20} />}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <div className="px-4 pt-4">
                        <div className={cn("rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-3", isMinified && "lg:hidden")}>
                            <p className="text-tiny font-bold uppercase tracking-[0.14em] text-foreground-tertiary">Navigation</p>
                            <p className="mt-2 text-xs text-foreground-subtle">
                                Modules consolidate filtered views into tabs and query-driven screens.
                            </p>
                        </div>
                    </div>

                    <SidebarNavigation items={visibleModules} counts={counts} isMinified={isMinified} />
                </div>

                <div className={cn("border-t border-slate-800 px-4 py-3", isMinified && "lg:text-center")}>
                    <div className={cn(isMinified && "lg:hidden block")}>
                        <SidebarFooterMeta role={admin?.role} />
                    </div>
                    <span className={cn("hidden select-none text-tiny font-bold tracking-widest text-foreground-subtle", isMinified && "lg:inline-block")}>
                        v2
                    </span>
                </div>
            </aside>
        </>
    );
}
