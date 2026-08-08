"use client";

import Link from "next/link";
import { PlusCircle } from "@/icons/IconRegistry";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/utils";
import { usePostAdNavigation } from "@/hooks/usePostAdNavigation";
import { useAuth } from "@/context/AuthContext";
import { useBottomBar } from "@/context/BottomBarContext";
import { getMobileChromePolicy } from "@/lib/mobile/chromePolicy";
import {
    getNavigationItems,
} from "@/config/navigation";
import { useAuthModal } from "@/context/AuthModalContext";

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
    const { showLogin, isAuthModalOpen } = useAuthModal();
    const { status, user } = useAuth();
    const isLoggedIn = status === "authenticated";
    const { isBackendUp, handlePostAdClick } = usePostAdNavigation({
        isLoggedIn,
        onShowLogin: showLogin,
    });
    const { actions, isVisible: isBottomActionsVisible } = useBottomBar();
    const policy = getMobileChromePolicy(pathname);

    const navItems = getNavigationItems("mobile-bottom-nav", { isLoggedIn, user });
    const hasContextActionBar = isBottomActionsVisible && actions.length > 0;
    // Hide bottom nav while auth modal is open — auth is the sole focus
    const shouldRender = enabled && policy.showMobileBottomNav && !hasContextActionBar && !isAuthModalOpen;

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
                className="grid min-w-0 flex-1 gap-1"
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
                                "flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-center transition-colors",
                                isActive
                                    ? "bg-blue-50 text-link-dark font-medium"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground font-normal"
                            )}
                        >
                            <Icon className="h-4.5 w-4.5 shrink-0" />
                            <span className="max-w-full truncate text-2xs font-normal leading-tight">
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
            className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 shadow-[0_-4px_20px_rgba(15,23,42,0.06)] backdrop-blur-xl md:hidden"
        >
            <div className="mx-auto flex max-w-screen-sm items-end gap-1 px-2 pt-1 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pb-[max(0.35rem,env(safe-area-inset-bottom))]">
                {renderNavItems(leftItems)}

                <button
                    onClick={handlePostAdClick}
                    disabled={!isBackendUp}
                    aria-label="Create a new listing"
                    className={cn(
                        "flex h-[54px] w-[58px] shrink-0 flex-col items-center justify-start gap-0.5 rounded-xl px-1 pt-0.5 text-center transition-transform active:scale-95",
                        !isBackendUp && "cursor-not-allowed opacity-50"
                    )}
                >
                    <div
                        className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-transform",
                            isBackendUp
                                ? "bg-blue-600 text-white shadow-blue-200"
                                : "bg-muted text-muted-foreground"
                        )}
                    >
                        <PlusCircle className="h-5 w-5" />
                    </div>
                    <span
                        className={cn(
                            "text-2xs font-normal leading-tight",
                            isBackendUp ? "text-link" : "text-muted-foreground"
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
