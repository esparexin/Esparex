"use client";

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/utils";
import { usePostAdNavigation } from "@/hooks/usePostAdNavigation";
import { useAuth } from "@/context/AuthContext";
import { useBottomBar } from "@/context/BottomBarContext";
import { getMobileChromePolicy } from "@/lib/mobile/chromePolicy";
import {
    getNavigationItems,
} from "@/config/navigation";

/**
 * MobileBottomNav
 *
 * Sources navigation items from the centralized `navigation.ts` config
 * via the `mobile-bottom-nav` surface. The Post Ad button is special-cased
 * as it requires backend availability logic from `usePostAdNavigation`.
 */
interface MobileBottomNavProps {
    enabled?: boolean;
}

export function MobileBottomNav({ enabled = true }: MobileBottomNavProps) {
    const pathname = usePathname();
    const { isBackendUp, handlePostAdClick } = usePostAdNavigation();
    const { status, user } = useAuth();
    const { actions, isVisible: isBottomActionsVisible } = useBottomBar();
    const policy = getMobileChromePolicy(pathname);

    const isLoggedIn = status === "authenticated";
    const navItems = getNavigationItems("mobile-bottom-nav", { isLoggedIn, user });
    const hasContextActionBar = isBottomActionsVisible && actions.length > 0;
    const shouldRender = enabled && policy.showMobileBottomNav && !hasContextActionBar;

    if (!shouldRender) {
        return null;
    }

    // Split items into before/after "Post Ad" slot (the center button)
    const half = Math.floor(navItems.length / 2);
    const leftItems = navItems.slice(0, half);
    const rightItems = navItems.slice(half);
    const isActivePath = (href: string) => href === "/"
        ? pathname === href
        : pathname === href || pathname?.startsWith(`${href}/`);

    const renderNavItems = (items: typeof navItems) => {
        if (items.length === 0) {
            return <div className="flex-1" />;
        }

        return (
            <div
                className="grid min-w-0 flex-1 gap-1.5"
                style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
            >
                {items.map((item) => {
                    const href = item.href ?? (item.page ? `/${item.page}` : "/");
                    const isActive = isActivePath(href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.id}
                            href={href}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                                "flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-center transition-colors",
                                isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <Icon className="h-5 w-5 shrink-0" />
                            <span className="max-w-full truncate text-[10px] font-semibold leading-tight">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        );
    };

    return (
        <nav
            aria-label="Mobile footer navigation"
            className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 shadow-[0_-8px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden"
        >
            <div className="mx-auto flex max-w-screen-sm items-end gap-1.5 px-2 pt-2 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                {renderNavItems(leftItems)}

                <button
                    onClick={handlePostAdClick}
                    disabled={!isBackendUp}
                    aria-label="Create a new listing"
                    className={cn(
                        "flex h-[72px] w-[76px] shrink-0 flex-col items-center justify-start gap-1 rounded-[24px] px-2 pt-0.5 text-center transition-transform active:scale-95",
                        !isBackendUp && "cursor-not-allowed opacity-50"
                    )}
                >
                    <div
                        className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform",
                            isBackendUp
                                ? "bg-blue-600 text-white shadow-blue-200"
                                : "bg-muted text-muted-foreground"
                        )}
                    >
                        <PlusCircle className="h-6 w-6" />
                    </div>
                    <span
                        className={cn(
                            "text-[10px] font-semibold leading-tight",
                            isBackendUp ? "text-blue-600" : "text-muted-foreground"
                        )}
                    >
                        Post Ad
                    </span>
                </button>

                {renderNavItems(rightItems)}
            </div>
        </nav>
    );
}
