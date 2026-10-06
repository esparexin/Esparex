"use client";
/* ui-guard-ignore: parallel-responsive-dom [Single-instance shell header with responsive desktop/mobile action bars] */

import { useEffect, useMemo, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Search, LogIn, Button, Input, Z_INDEX, TrendingUp, MapPin, ChevronDown, Menu } from "@esparex/ui";

import { HeaderLocation } from "../layout/HeaderLocation";
import type { User } from "@esparex/contracts";
import { LocationOverlayHost } from "../location/LocationOverlayHost";
import { useMobileNavDrawer } from "@/components/mobile/MobileNavDrawerProvider";
import { useMounted } from "@/hooks/useMounted";
import type { UserPage } from "@/lib/routeUtils";
import { getMobileChromePolicy } from "@/lib/mobile/chromePolicy";
import { useSharedHeaderLogic } from "@/components/user/hooks/useSharedHeaderLogic";
import { NotificationBellDropdown } from "@/components/user/NotificationBellDropdown";
import { parsePublicBrowseParams } from "@/lib/publicBrowseRoutes";
import { HeaderSearchDropdown } from "./header/HeaderSearchDropdown";
import { HeaderAccountMenu } from "./header/HeaderAccountMenu";
import { HeaderBusinessButton } from "./header/HeaderBusinessButton";
import {
  getNavigationItems,
  getNavigationSections,
  type ResolvedNavigationItem,
} from "@/config/navigation";
import { usePostAdNavigation } from "@/hooks/usePostAdNavigation";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";
import { canRegisterBusiness, isApprovedBusiness } from "@/guards/businessGuards";
import { toSafeImageSrc } from "@/lib/image/imageUrl";
import type { NotificationResponse } from "@/lib/api/user/notifications";
import { DEFAULT_APP_LOCATION } from "@/types/location";
import { cn } from "@/lib/utils";

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
  navigateTo, isLoggedIn, isAuthLoading = false, onLogout = () => {}, user = null, onSearch, onShowLogin,
}: HeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMounted = useMounted();
  const { setIsOpen: setIsMobileDrawerOpen } = useMobileNavDrawer();

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

  const [isMobileSearchEditing, setIsMobileSearchEditing] = useState(false);
  const [headerLocationQuery, setHeaderLocationQuery] = useState("");

  useEffect(() => {
    setShowLocationSelector(false);
    setShowSearchDropdown(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: resets transient UI state on route change
    setIsMobileSearchEditing(false);
  }, [pathname, setShowLocationSelector, setShowSearchDropdown]);

  const openMobileLocationSelector = useCallback(() => setShowLocationSelector(true), [setShowLocationSelector]);
  const handleCloseLocationOverlay = useCallback(() => {
    setShowLocationSelector(false);
    setHeaderLocationQuery("");
  }, [setShowLocationSelector]);

  return (
    <header
      style={{ zIndex: Z_INDEX.userHeader }}
      className="fixed top-0 left-0 right-0 w-full bg-background border-b border-border shadow-xs transition-shadow duration-200 pt-[env(safe-area-inset-top)] md:pt-0"
    >
      {/* ── DESKTOP HEADER INNER (MD+) ───────────────────────────────────────────────────────────── */}
      <div className="hidden md:flex max-w-7xl mx-auto px-4 h-16 items-center gap-6">
        <button onClick={() => navigateTo("home")} className="flex items-center hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg py-1 cursor-pointer">
          <Image src="/icons/logo.png" alt="Esparex" width={495} height={112} unoptimized className="h-[25px] w-auto" />
        </button>

        <div className="relative" ref={locationDropdownRef}>
          <HeaderLocation
            isOpen={showLocationSelector}
            onOpenChange={(open) => { 
              if (open) setShowSearchDropdown(false);
              setShowLocationSelector(open);
            }}
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
              className="pl-11 h-11 w-full bg-background border border-border focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 transition-all rounded-xl shadow-xs text-body-lg md:text-body"
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

        <HeaderDesktopActions
          isMounted={isMounted}
          isAuthLoading={isAuthLoading}
          isLoggedIn={isLoggedIn}
          user={user}
          onLogout={onLogout}
          onShowLogin={onShowLogin}
          navigateTo={(page) => navigateTo(page)}
          notificationsData={notificationsData}
          unreadCount={notifUnreadCount}
          onRefreshNotifications={refetchNotifications}
        />
      </div>

      <div className="flex md:hidden flex-col">
        <MobileHeaderTopBar
          isMounted={isMounted}
          resolvedHeaderLocation={resolvedHeaderLocation}
          showLocation={chromePolicy.showMobileLocation}
          onNavigateHome={() => navigateTo("home")}
          onOpenLocationSelector={openMobileLocationSelector}
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
        />
        {chromePolicy.showMobileSearch && (
          <div className="flex items-center px-3 py-1 bg-background h-14 min-h-[56px] gap-2.5">
            {chromePolicy.showStickySearch && !isMobileSearchEditing ? (
              <button
                type="button"
                onClick={() => {
                  setIsMobileSearchEditing(true);
                  setSearchQuery(browseParams.q || "");
                }}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-muted px-3 h-11 text-left hover:bg-muted/80 transition-colors cursor-pointer border border-transparent"
                aria-label={`Tap to search. Current search: ${stickySearchLabel}`}
              >
                <Search className="h-4 w-4 shrink-0 text-foreground-subtle" />
                <span
                  className={cn(
                    "truncate text-body-lg md:text-body",
                    browseParams.q?.trim() ? "font-medium text-foreground" : "font-normal text-foreground-subtle"
                  )}
                >
                  {stickySearchLabel}
                </span>
              </button>
            ) : (
              <form onSubmit={(e) => { handleSearchSubmit(e); setIsMobileSearchEditing(false); }} className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle pointer-events-none" />
                <Input
                  id="header-mobile-search"
                  autoFocus={isMobileSearchEditing}
                  className="w-full pl-9 h-11 bg-muted border-transparent focus-visible:bg-background focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 transition-all rounded-xl text-body-lg md:text-body placeholder:text-foreground-subtle"
                  placeholder="Search for mobiles, parts, services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => { if (!searchQuery.trim() && chromePolicy.showStickySearch) setIsMobileSearchEditing(false); }}
                  aria-label="Search listings"
                />
              </form>
            )}
            <div className="flex items-center gap-1">
              {!isLoggedIn && !isAuthLoading && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-xl text-foreground hover:bg-muted cursor-pointer"
                  onClick={onShowLogin}
                  aria-label="Log in to Esparex"
                >
                  <LogIn className="h-5 w-5" />
                </Button>
              )}
              {isLoggedIn && (
                <NotificationBellDropdown notificationsData={notificationsData} unreadCount={notifUnreadCount} onRefresh={refetchNotifications} variant="mobile" />
              )}
            </div>
          </div>
        )}
      </div>

      <LocationOverlayHost
        isOpen={showLocationSelector}
        onClose={handleCloseLocationOverlay}
        containerRef={locationDropdownRef}
        locationQuery={headerLocationQuery}
        onLocationQueryChange={setHeaderLocationQuery}
      />
    </header>
  );
}

// ----------------------------------------------------------------------
// Responsive header sub-sections (P1-1 — single-instance responsive header)
// ----------------------------------------------------------------------
// `HeaderDesktopActions` (desktop actions bar) and `MobileHeaderTopBar`
// (mobile top bar) were separate viewport-split files, both mounted and
// switched by CSS breakpoints. They are merged into this single responsive
// `Header.tsx`: one file, one implementation, CSS-breakpoint switching
// (`hidden md:flex` / `flex md:hidden`) — no JS viewport branching for layout.
// The legacy files remain as deprecated re-export shims (deleted in Phase 4).

export interface HeaderDesktopActionsProps {
  isMounted: boolean;
  isAuthLoading: boolean;
  isLoggedIn: boolean;
  user?: User | null;
  onLogout?: () => void;
  onShowLogin?: () => void;
  navigateTo: (page: UserPage) => void;
  notificationsData?: NotificationResponse;
  unreadCount: number;
  onRefreshNotifications: () => Promise<unknown>;
}

export function HeaderDesktopActions({
  isMounted,
  isAuthLoading,
  isLoggedIn,
  user = null,
  onLogout = () => {},
  onShowLogin,
  navigateTo,
  notificationsData,
  unreadCount,
  onRefreshNotifications,
}: HeaderDesktopActionsProps) {
  const router = useRouter();

  const businessStatus = normalizeBusinessStatus(user?.businessStatus, "none");
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

  return (
    <div className="flex items-center gap-3 ml-auto">
      {!isMounted || isAuthLoading ? (
        <>
          <div className="hidden lg:flex h-9 w-32 rounded-xl bg-muted animate-pulse border border-border" aria-hidden="true" />
          <div className="h-9 w-9 rounded-full bg-muted animate-pulse border border-border" aria-hidden="true" />
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
            unreadCount={unreadCount}
            onRefresh={onRefreshNotifications}
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
  );
}

export interface MobileHeaderTopBarProps {
  isMounted: boolean;
  resolvedHeaderLocation: string;
  showLocation?: boolean;
  onNavigateHome: () => void;
  onOpenLocationSelector: () => void;
  onOpenMobileDrawer: () => void;
}

export function MobileHeaderTopBar({
  isMounted,
  resolvedHeaderLocation,
  showLocation = true,
  onNavigateHome,
  onOpenLocationSelector,
  onOpenMobileDrawer,
}: MobileHeaderTopBarProps) {
  const displayLocation = isMounted
    ? resolvedHeaderLocation || DEFAULT_APP_LOCATION.display
    : DEFAULT_APP_LOCATION.display;

  return (
    <div className="flex items-center px-3.5 h-12 bg-muted/40 border-b border-border/50 text-caption text-foreground-secondary gap-2">
      {/* Left Navigation Group: Hamburger Menu + Full Esparex Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className="h-9 w-9 rounded-xl hover:bg-muted active:bg-muted/80 text-foreground-secondary flex items-center justify-center cursor-pointer transition-colors"
          aria-label="Open navigation drawer"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center shrink-0 hover:opacity-80 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md py-0.5"
          aria-label="Go to Esparex Home"
        >
          <Image
            src="/icons/logo.png"
            alt="Esparex"
            width={495}
            height={112}
            unoptimized
            className="h-[24px] w-auto object-contain"
          />
        </button>
      </div>

      {/* Right Location Group: Location Selector (Right-Aligned) */}
      {showLocation && (
        <button
          type="button"
          onClick={onOpenLocationSelector}
          className="ml-auto flex items-center justify-end gap-1.5 flex-1 min-w-0 max-w-[180px] xs:max-w-[220px] sm:max-w-[260px] h-full text-right hover:text-primary transition-colors cursor-pointer group"
          aria-label={`Current location: ${displayLocation}. Tap to change location.`}
        >
          <MapPin className="h-4 w-4 text-primary shrink-0 group-hover:scale-105 transition-transform" />
          <span className="truncate block min-w-0 text-caption font-medium text-foreground">
            <span className={`transition-opacity duration-200 ${isMounted ? "opacity-100" : "opacity-0"}`}>
              {displayLocation}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-0.5" />
        </button>
      )}
    </div>
  );
}
