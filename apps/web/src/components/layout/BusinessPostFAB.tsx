"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Wrench, CircuitBoard, Bell } from "@/icons/IconRegistry";
import { useAuth } from "@/context/AuthContext";
import { isApprovedBusiness } from "@/guards/businessGuards";
import { cn } from "@/components/ui/utils";

/**
 * BusinessPostFAB
 * Floating action button (bottom-right) for authenticated users.
 * Expands to reveal "Create Smart Alert" for all users, and
 * "Post Service" / "Post Spare Part" for verified approved business users.
 * Mounted globally in CommonLayout so it persists across all pages.
 */
export function BusinessPostFAB() {
    const { user, status } = useAuth();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    // Collapse on every navigation
    useEffect(() => {
        void (async () => { setIsOpen(false); })();
    }, [pathname]);

    // Only for authenticated users
    if (status !== "authenticated" || !user) return null;

    const isApproved = isApprovedBusiness(user);

    // Dynamic actions based on role and business verification status
    const actions = [
        ...(isApproved ? [
            {
                id: "spare-part",
                label: "Post Spare Part",
                href: "/post-ad",
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
        ] : []),
        {
            id: "smart-alert",
            label: "Create Smart Alert",
            href: "/account/smartalerts",
            icon: Bell,
            bg: "bg-amber-600 hover:bg-amber-700",
        },
    ];

    // Hide while the user is actively on creation / editing pages
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
            aria-label="Action menu"
        >
            {/* Sub-actions — stagger in from bottom */}
            {actions.map((action, i) => {
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
                aria-label={isOpen ? "Close action menu" : "Open action menu"}
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
