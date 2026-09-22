"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Search,
  LogIn,
  Button,
  Input,
  Z_INDEX,
} from "@esparex/ui";

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
import { HeaderDesktopActions } from "./header/HeaderDesktopActions";
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

  return (
    <header
      style={{ zIndex: Z_INDEX.userHeader }}
      className="fixed top-0 left-0 right-0 z-50 w-full bg-background border-b border-border/80 shadow-xs transition-shadow duration-200 pt-[env(safe-area-inset-top)] md:pt-0"
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
              className="pl-11 h-11 w-full bg-background border border-border focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 transition-all rounded-2xl shadow-xs text-body-lg md:text-body"
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
          onNavigateHome={() => navigateTo("home")}
          onOpenLocationSelector={() => setShowLocationSelector(true)}
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
        />
        {chromePolicy.showMobileSearch && (
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
                  className="w-full pl-9 h-11 bg-muted border-transparent focus-visible:bg-background focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 transition-all rounded-xl text-body-lg md:text-body placeholder:text-foreground-subtle"
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-xl text-link hover:bg-primary/10 cursor-pointer"
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
        onClose={() => { setShowLocationSelector(false); setHeaderLocationQuery(""); }}
        containerRef={locationDropdownRef}
        locationQuery={headerLocationQuery}
        onLocationQueryChange={setHeaderLocationQuery}
      />
    </header>
  );
}
