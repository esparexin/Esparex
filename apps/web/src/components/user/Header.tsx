"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Search,
  LogIn,
  TrendingUp,
} from "@/icons/IconRegistry";

import { HeaderLocation } from "../layout/HeaderLocation";
import type { User } from "@/types/User";
import {
  Button,
  Z_INDEX,
} from "@esparex/ui";
import { Input } from "../ui/input";

import { LocationOverlayHost } from "../location/LocationOverlayHost";
import { useMobileNavDrawer } from "@/components/mobile/MobileNavDrawerProvider";
import { useMounted } from "@/hooks/useMounted";
import type { UserPage } from "@/lib/routeUtils";

import {
  getNavigationItems,
  getNavigationSections,
  type ResolvedNavigationItem,
} from "@/config/navigation";
import { getMobileChromePolicy } from "@/lib/mobile/chromePolicy";
import { useSharedHeaderLogic } from "@/components/user/hooks/useSharedHeaderLogic";
import { NotificationBellDropdown } from "@/components/user/NotificationBellDropdown";
import { usePostAdNavigation } from "@/hooks/usePostAdNavigation";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";
import { canRegisterBusiness, isApprovedBusiness } from "@/guards/businessGuards";
import { toSafeImageSrc } from "@/lib/image/imageUrl";
import { parsePublicBrowseParams } from "@/lib/publicBrowseRoutes";
import { HeaderAccountMenu } from "./header/HeaderAccountMenu";
import { HeaderBusinessButton } from "./header/HeaderBusinessButton";
import { HeaderSearchDropdown } from "./header/HeaderSearchDropdown";
import { MobileHeaderTopBar } from "./header/MobileHeaderTopBar";

export interface HeaderProps {
  currentPage?: string;
  navigateTo: (page: UserPage, adId?: number, category?: string, sellerIdOrBusinessId?: string, serviceId?: string, sellerId?: string, sellerType?: "business" | "individual") => void;
  isLoggedIn: boolean;
  isAuthLoading?: boolean;
  onLogout?: () => void;
  user?: User | null;
  onSearch?: (query: string) => void;
  onShowLogin?: () => void;
}

export function Header({
  navigateTo,
  isLoggedIn,
  isAuthLoading = false,
  onLogout = () => {},
  user = null,
  onSearch,
  onShowLogin,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMounted = useMounted();
  const { setIsOpen: setIsMobileDrawerOpen } = useMobileNavDrawer();

  const businessStatus = normalizeBusinessStatus(user?.businessStatus, "pending");
  const isBusinessLive = Boolean(user && isApprovedBusiness(user));
  const shouldShowPendingReview = businessStatus === "pending" && Boolean(user?.businessId);
  const canRegister = Boolean(user && canRegisterBusiness(user));
  const safeProfilePhoto = useMemo(
    () => toSafeImageSrc(user?.profilePhoto, ""),
    [user?.profilePhoto]
  );

  const { isBackendUp, handlePostAdClick } = usePostAdNavigation({
    isLoggedIn,
    onShowLogin,
    navigateTo: (path) => {
      navigateTo(path as UserPage);
    },
  });

  const chromePolicy = getMobileChromePolicy(pathname);
  const browseParams = useMemo(() => parsePublicBrowseParams(searchParams), [searchParams]);

  const stickySearchLabel = useMemo(() => {
    const trimmedQuery = browseParams.q?.trim();
    if (trimmedQuery) return trimmedQuery;
    return browseParams.type === "service"
      ? "Browse services"
      : browseParams.type === "spare_part"
        ? "Browse spare parts"
        : "Browse ads";
  }, [browseParams.q, browseParams.type]);

  const shouldFetchHeaderNotifications =
    isLoggedIn &&
    !isAuthLoading &&
    !pathname.startsWith("/account/business/apply") &&
    !pathname.startsWith("/business/edit");

  const {
    notificationsData,
    notifUnreadCount,
    refetchNotifications,
    showLocationSelector,
    setShowLocationSelector,
    locationDropdownRef,
    resolvedHeaderLocation,
    searchQuery,
    setSearchQuery,
    showSearchDropdown,
    setShowSearchDropdown,
    searchRef,
    handleSearch,
    handleSearchSubmit,
    handleSearchFocus,
    searchItems,
    isRecent,
    clearSearchHistory,
  } = useSharedHeaderLogic({
    isLoggedIn,
    onSearch,
    disableNotificationsFetch: !shouldFetchHeaderNotifications,
  });

  const { account: profileMenuItems } = getNavigationSections(
    getNavigationItems("profile-dropdown", { isLoggedIn, user: user ?? null })
  );

  const handleMenuItemClick = (item: ResolvedNavigationItem) => {
    if (item.href) {
      void router.push(item.href);
      return;
    }
    if (item.page) {
      navigateTo(item.page);
    }
  };

  const [isMobileSearchEditing, setIsMobileSearchEditing] = useState(false);
  const [headerLocationQuery, setHeaderLocationQuery] = useState("");

  useEffect(() => {
    setShowLocationSelector(false);
    setShowSearchDropdown(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: resets transient UI state on route change
    setIsMobileSearchEditing(false);
  }, [pathname, setShowLocationSelector, setShowSearchDropdown]);

  return (
    <header
      style={{ zIndex: Z_INDEX.userHeader }}
      className="sticky top-0 z-50 w-full border-b glass shadow-premium pt-[env(safe-area-inset-top)] md:pt-0"
    >
      {/* ── DESKTOP HEADER INNER (MD+) ───────────────────────────────────────────────────────────── */}
      <div className="hidden md:flex max-w-7xl mx-auto px-4 h-16 items-center gap-6">
        <button onClick={() => navigateTo("home")} className="flex items-center hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg py-1 cursor-pointer">
          <Image src="/icons/logo.png" alt="Esparex Logo" width={495} height={112} unoptimized className="h-[25px] w-auto" />
        </button>

        <div className="relative" ref={locationDropdownRef}>
          <HeaderLocation
            isOpen={showLocationSelector}
            onOpenChange={(open) => { setShowLocationSelector(open); if (open) setShowSearchDropdown(false); }}
            query={headerLocationQuery}
            onQueryChange={setHeaderLocationQuery}
          />
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-xl relative" ref={searchRef}>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
            <Input
              id="header-desktop-search"
              aria-label="Search for mobiles, parts, services"
              className="pl-11 h-11 w-full bg-background border border-border focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 transition-all rounded-2xl shadow-xs text-body"
              placeholder="Search for mobiles, parts, services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { handleSearchFocus(); setShowLocationSelector(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <HeaderSearchDropdown
            isOpen={showSearchDropdown}
            isRecent={isRecent}
            searchItems={searchItems}
            onSelectSearch={handleSearch}
            onClearHistory={clearSearchHistory}
          />
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {!isMounted || isAuthLoading ? (
            <>
              <div className="hidden lg:flex h-8 w-32 rounded-xl bg-muted animate-pulse border border-border" aria-hidden="true" />
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse border border-border" aria-hidden="true" />
            </>
          ) : isLoggedIn ? (
            <>
              <HeaderBusinessButton
                isBusinessLive={isBusinessLive}
                shouldShowPendingReview={shouldShowPendingReview}
                canRegister={canRegister}
                businessStatus={businessStatus}
                onNavigate={navigateTo}
              />
              <NotificationBellDropdown
                notificationsData={notificationsData}
                unreadCount={notifUnreadCount}
                onRefresh={refetchNotifications}
                variant="desktop"
              />
              <HeaderAccountMenu
                user={user}
                safeProfilePhoto={safeProfilePhoto}
                profileMenuItems={profileMenuItems}
                onMenuItemClick={handleMenuItemClick}
                onLogout={onLogout}
              />
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={onShowLogin} className="cursor-pointer">
              Login
            </Button>
          )}

          <Button
            size="sm"
            onClick={handlePostAdClick}
            disabled={!isBackendUp}
            className="rounded-full px-4 gap-2 shadow-sm hover:shadow-md transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title={!isBackendUp ? "Service temporarily unavailable" : "Post a new ad"}
          >
            <TrendingUp className="h-4 w-4" /> Post Ad
          </Button>
        </div>
      </div>

      <div className="flex md:hidden flex-col">
        <MobileHeaderTopBar
          isMounted={isMounted}
          resolvedHeaderLocation={resolvedHeaderLocation}
          onNavigateHome={() => navigateTo("home")}
          onOpenLocationSelector={() => setShowLocationSelector(true)}
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
        />
        <div className={`flex items-center px-3 py-1 bg-background ${chromePolicy.showStickySearch ? "min-h-[56px] h-14 gap-2.5 border-b border-border" : "min-h-[58px] h-14 gap-2.5"}`}>
          {chromePolicy.showStickySearch && !isMobileSearchEditing ? (
            <button type="button" onClick={() => { setIsMobileSearchEditing(true); setSearchQuery(browseParams.q || ""); }} className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-muted/50 px-4 h-11 text-left hover:bg-muted transition-colors cursor-pointer" aria-label={`Tap to search. Current search: ${stickySearchLabel}`}>
              <Search className="h-4 w-4 shrink-0 text-foreground-subtle" />
              <span className="truncate text-body font-medium text-foreground-secondary">{stickySearchLabel}</span>
            </button>
          ) : (
            <form onSubmit={(e) => { handleSearchSubmit(e); setIsMobileSearchEditing(false); }} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" />
              <Input
                id="header-mobile-search"
                autoFocus={isMobileSearchEditing}
                className="w-full pl-9 h-11 bg-muted border-transparent focus-visible:bg-background focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 transition-all rounded-xl text-body placeholder:text-foreground-subtle"
                placeholder="Search phones, laptops, spare parts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => { if (!searchQuery.trim() && chromePolicy.showStickySearch) setIsMobileSearchEditing(false); }}
                aria-label="Search listings"
              />
            </form>
          )}
          <div className="flex items-center gap-1">
            {!isLoggedIn && !isAuthLoading && (
              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-link hover:bg-primary/10 cursor-pointer" onClick={onShowLogin}>
                <LogIn className="h-5 w-5" />
              </Button>
            )}
            {isLoggedIn && (
              <NotificationBellDropdown notificationsData={notificationsData} unreadCount={notifUnreadCount} onRefresh={refetchNotifications} variant="mobile" />
            )}
          </div>
        </div>
      </div>

      <LocationOverlayHost
        isOpen={showLocationSelector}
        onClose={() => { setShowLocationSelector(false); setHeaderLocationQuery(""); }}
        containerRef={locationDropdownRef}
        locationQuery={headerLocationQuery}
        onLocationQueryChange={setHeaderLocationQuery}
      />
    </header>
  );
}
