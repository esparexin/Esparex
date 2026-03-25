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
    const renderNavItems = (items: typeof navItems) =>
        items.map((item) => {
            const href = item.href ?? (item.page ? `/${item.page}` : "/");
            const isActive = pathname === href;
            const Icon = item.icon;

            return (
                <Link
                    key={item.id}
                    href={href}
                    className={cn(
                        "flex flex-col items-center justify-center w-full h-full space-y-1",
                        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Icon className={cn("w-6 h-6", isActive && "fill-current")} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
            );
        });

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 pb-safe">
            <div className="flex justify-around items-center h-16">
                {/* Left nav items */}
                {renderNavItems(leftItems)}

                {/* Center: Post Ad Button (special-cased, not from config) */}
                <button
                    onClick={handlePostAdClick}
                    disabled={!isBackendUp}
                    className={cn(
                        "flex flex-col items-center justify-center w-full h-full space-y-1",
                        !isBackendUp && "cursor-not-allowed opacity-50"
                    )}
                >
                    <div
                        className={cn(
                            "rounded-full p-1 shadow-sm transition-transform",
                            isBackendUp
                                ? "bg-primary text-primary-foreground hover:scale-105"
                                : "bg-muted text-muted-foreground"
                        )}
                    >
                        <PlusCircle className="w-5 h-5" />
                    </div>
                    <span
                        className={cn(
                            "text-[10px] font-medium",
                            isBackendUp ? "text-primary" : "text-muted-foreground"
                        )}
                    >
                        Post
                    </span>
                </button>

                {/* Right nav items */}
                {renderNavItems(rightItems)}
            </div>
        </div>
    );
}
