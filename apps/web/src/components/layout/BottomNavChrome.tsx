"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BottomNavigation, PlusCircle } from "@esparex/ui";
import { getMobileChromePolicy } from "@/lib/mobile/chromePolicy";
import { usePostAdNavigation } from "@/hooks/usePostAdNavigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { useBottomBar } from "@/context/BottomBarContext";
import { getNavigationItems } from "@/config/navigation";
import { cn } from "@/lib/utils";

/**
 * Mobile bottom navigation chrome, composed on the canonical
 * `BottomNavigation` from `@esparex/ui`:
 * - items from the centralized `navigation.ts` config (`mobile-bottom-nav` surface)
 * - center "Post Ad" action with backend-availability gating
 * - hidden while the auth modal is open or a contextual action bar is visible
 *
 * Rendered by `ClientChromeLoader`; a chrome sub-section, not a competing
 * viewport implementation.
 */
export function BottomNavChrome() {
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
    const shouldRender = policy.showMobileBottomNav && !hasContextActionBar && !isAuthModalOpen;

    if (!shouldRender) {
        return null;
    }

    return (
        <BottomNavigation
            navigation={{
                primary: navItems.map((item) => ({
                    id: item.id,
                    label: item.label,
                    href: item.href ?? (item.page ? `/${item.page}` : "/"),
                    icon: item.icon,
                })),
            }}
            LinkComponent={Link}
            currentPath={pathname ?? undefined}
            className="fixed inset-x-0 bottom-0 z-50 bg-background/95 shadow-[0_-4px_20px_rgba(15,23,42,0.06)] backdrop-blur-xl md:hidden"
            ariaLabel="Mobile footer navigation"
            isItemActive={(item, currentPath) => {
                if (item.href === "/") return currentPath === item.href;
                return currentPath === item.href || (currentPath?.startsWith(`${item.href}/`) ?? false);
            }}
            centerAction={
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
                                ? "bg-primary text-primary-foreground shadow-primary/20"
                                : "bg-muted text-muted-foreground"
                        )}
                    >
                        <PlusCircle className="h-5 w-5" />
                    </div>
                    <span
                        className={cn(
                            "text-tiny font-normal leading-tight",
                            isBackendUp ? "text-link" : "text-muted-foreground"
                        )}
                    >
                        Post Ad
                    </span>
                </button>
            }
        />
    );
}
