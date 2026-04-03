"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Wrench, CircuitBoard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isApprovedBusiness } from "@/guards/businessGuards";
import { cn } from "@/components/ui/utils";

const ACTIONS = [
    {
        id: "spare-part",
        label: "Post Spare Part",
        href: "/post-spare-part-listing",
        icon: CircuitBoard,
        bg: "bg-violet-600 hover:bg-violet-700",
    },
    {
        id: "service",
        label: "Post Service",
        href: "/post-service",
        icon: Wrench,
        bg: "bg-emerald-600 hover:bg-emerald-700",
    },
] as const;

/**
 * BusinessPostFAB
 * Floating action button (bottom-right) for verified business users.
 * Expands to reveal "Post Service" and "Post Spare Part" sub-actions.
 * Mounted globally in CommonLayout so it persists across all pages.
 *
 * Visibility rules:
 *  - Only renders for authenticated users with businessStatus === "live"
 *  - Hidden on the post pages themselves (no need to FAB from within the form)
 *  - Collapses automatically on route change
 *  - Sits at z-40, below modals/drawers (z-50) but above page content
 *  - bottom offset tracks the mobile footer nav height on small screens
 *  - bottom-8 on desktop
 */
export function BusinessPostFAB() {
    const { user, status } = useAuth();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    // Collapse on every navigation
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Only for authenticated live-business users
    if (status !== "authenticated" || !user || !isApprovedBusiness(user)) return null;

    // Hide while the user is already on a posting page
    if (
        pathname?.startsWith("/post-service") ||
        pathname?.startsWith("/post-spare-part") ||
        pathname?.startsWith("/post-ad") ||
        pathname?.startsWith("/edit-service") ||
        pathname?.startsWith("/edit-spare-part") ||
        pathname?.startsWith("/edit-ad")
    ) {
        return null;
    }

    return (
        <div
            className="fixed right-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] md:bottom-8 md:right-6 z-40 flex flex-col items-end gap-3"
            aria-label="Business posting actions"
        >
            {/* Sub-actions — stagger in from bottom */}
            {ACTIONS.map((action, i) => {
                const Icon = action.icon;
                return (
                    <Link
                        key={action.id}
                        href={action.href}
                        className={cn(
                            "flex items-center gap-3 pl-4 pr-5 h-11 rounded-full shadow-lg text-white text-sm font-semibold transition-all duration-200",
                            action.bg,
                            isOpen
                                ? "opacity-100 translate-y-0 pointer-events-auto"
                                : "opacity-0 translate-y-4 pointer-events-none"
                        )}
                        style={{ transitionDelay: isOpen ? `${i * 60}ms` : "0ms" }}
                        tabIndex={isOpen ? 0 : -1}
                        aria-hidden={!isOpen}
                    >
                        <Icon className="w-4 h-4 shrink-0" />
                        {action.label}
                    </Link>
                );
            })}

            {/* Trigger button */}
            <button
                onClick={() => setIsOpen(o => !o)}
                aria-label={isOpen ? "Close posting menu" : "Post service or spare part"}
                aria-expanded={isOpen}
                className={cn(
                    "w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95",
                    isOpen
                        ? "bg-slate-700 hover:bg-slate-600"
                        : "bg-primary hover:scale-105"
                )}
            >
                <Plus
                    className={cn(
                        "w-7 h-7 text-white transition-transform duration-300",
                        isOpen && "rotate-45"
                    )}
                />
            </button>
        </div>
    );
}
