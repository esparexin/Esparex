"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Menu,
  MapPin,
  Search,
  LogIn,
  ChevronDown,
  Clock,
  TrendingUp,
  Building2,
  LayoutDashboard,
  LogOut,
} from "lucide-react";

import { HeaderLocation } from "../layout/HeaderLocation";
import { User } from "@/types/User";
import { getUserInitials } from "@/lib/headerUtils";
import { Button } from "@esparex/ui";
import { Input } from "../ui/input";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import LocationSelector from "../location/LocationSelector";
import { useMobileNavDrawer } from "@/components/mobile/MobileNavDrawerProvider";
import { useMounted } from "@/hooks/useMounted";
import type { UserPage } from "@/lib/routeUtils";
import { Z_INDEX } from "@/lib/zIndexConfig";
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
import { canRegisterBusiness } from "@/guards/businessGuards";
import { DEFAULT_IMAGE_PLACEHOLDER, toSafeImageSrc } from "@/lib/image/imageUrl";
import { DEFAULT_APP_LOCATION } from "@/types/location";
import { parsePublicBrowseParams } from "@/lib/publicBrowseRoutes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

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

const recentSearches = ["iPhone 14 Pro", "Samsung Galaxy", "MacBook Pro", "iPad Air"];

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
  const shouldShowPendingReview = businessStatus === "pending" && Boolean(user?.businessId);
  const canRegister = Boolean(user && canRegisterBusiness(user));
  const safeProfilePhoto = useMemo(
    () => toSafeImageSrc(user?.profilePhoto, ""),
    [user?.profilePhoto]
  );
  const [avatarSrc, setAvatarSrc] = useState<string>(safeProfilePhoto || DEFAULT_IMAGE_PLACEHOLDER);

  useEffect(() => {
    setAvatarSrc(safeProfilePhoto || DEFAULT_IMAGE_PLACEHOLDER);
  }, [safeProfilePhoto]);

  const { isBackendUp, handlePostAdClick } = usePostAdNavigation({
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
    headerLocationDetails,
    resolvedHeaderLocation,
    searchQuery,
    setSearchQuery,
    showSearchDropdown,
    setShowSearchDropdown,
    searchRef,
    handleSearch,
    handleSearchSubmit,
    handleSearchFocus,
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

  useEffect(() => {
    setShowLocationSelector(false);
    setShowSearchDropdown(false);
  }, [pathname, setShowLocationSelector, setShowSearchDropdown]);

  return (
    <>
      {/* ── DESKTOP HEADER (MD+) ───────────────────────────────────────────────────────────── */}
      <header
        style={{ zIndex: Z_INDEX.userHeader }}
        className="sticky top-0 w-full border-b glass shadow-premium hidden md:block"
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-6">
          {/* Logo */}
          <button onClick={() => navigateTo("home")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/icons/logo.png"
              alt="Esparex Logo"
              width={512}
              height={206}
              style={{ height: "40px", width: "auto" }}
            />
          </button>

          {/* Location Selector */}
          <div className="relative" ref={locationDropdownRef}>
            <HeaderLocation onClick={() => { setShowLocationSelector(!showLocationSelector); setShowSearchDropdown(false); }} />
            <div
              style={{ zIndex: Z_INDEX.userHeaderDropdown }}
              className={`absolute top-full left-0 mt-1 w-72 max-h-[52vh] bg-popover border rounded-xl shadow-lg overflow-hidden transition-all duration-200 flex flex-col ${
                showLocationSelector
                  ? "opacity-100 visible translate-y-0"
                  : "opacity-0 invisible -translate-y-2 pointer-events-none"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-1 overflow-hidden">
                {showLocationSelector ? (
                  <LocationSelector variant="panel" onClose={() => setShowLocationSelector(false)} />
                ) : null}
              </div>
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="flex-1 max-w-xl relative" ref={searchRef}>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
              <Input
                id="header-global-search"
                className="pl-11 h-11 w-full bg-muted/50 border-border/50 focus-visible:bg-background focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/5 transition-all rounded-2xl shadow-sm text-base"
                placeholder="Search for mobiles, parts, services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { handleSearchFocus(); setShowLocationSelector(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            {showSearchDropdown && (
              <div
                style={{ zIndex: Z_INDEX.userHeaderDropdown }}
                className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-2"
              >
                <div className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-1">Recent</div>
                {recentSearches.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSearch(s)}
                    className="w-full text-left px-2 py-2 hover:bg-muted rounded flex items-center gap-2 text-sm"
                  >
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop User Actions */}
          <div className="flex items-center gap-3 ml-auto">
            {!isMounted || isAuthLoading ? (
              <>
                <div className="hidden lg:flex h-8 w-32 rounded-xl bg-slate-100 animate-pulse border border-slate-200" aria-hidden="true" />
                <div className="h-8 w-8 rounded-full bg-slate-100 animate-pulse border border-slate-200" aria-hidden="true" />
              </>
            ) : isLoggedIn ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`hidden lg:flex gap-2 ${
                    businessStatus === "live" ? "text-primary font-semibold" : "text-muted-foreground"
                  } hover:text-foreground`}
                  onClick={() => {
                    if (businessStatus === "live" || shouldShowPendingReview || !canRegister) {
                      navigateTo("business-entry");
                    } else {
                      navigateTo("business-register");
                    }
                  }}
                >
                  {businessStatus === "live" ? (
                    <>
                      <LayoutDashboard className="h-4 w-4" />
                      <span className="hidden xl:inline">Business Hub</span>
                    </>
                  ) : shouldShowPendingReview ? (
                    <>
                      <Building2 className="h-4 w-4 text-amber-500" />
                      <span className="hidden xl:inline text-amber-600">Pending Review</span>
                    </>
                  ) : businessStatus === "rejected" ? (
                    <>
                      <Building2 className="h-4 w-4 text-red-500" />
                      <span className="hidden xl:inline text-red-600">Fix Application</span>
                    </>
                  ) : (
                    <>
                      <Building2 className="h-4 w-4" />
                      <span className="hidden xl:inline">Register Business</span>
                    </>
                  )}
                </Button>

                <NotificationBellDropdown
                  notificationsData={notificationsData}
                  unreadCount={notifUnreadCount}
                  onRefresh={refetchNotifications}
                  variant="desktop"
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative rounded-full h-8 w-8 flex-shrink-0 border-none hover:bg-transparent p-0 overflow-hidden ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      aria-label="Open account menu"
                    >
                      {safeProfilePhoto ? (
                        <Image
                          src={avatarSrc}
                          alt={user?.name || "Profile"}
                          width={32}
                          height={32}
                          unoptimized
                          className="h-8 w-8 rounded-full object-cover"
                          onError={() => setAvatarSrc(DEFAULT_IMAGE_PLACEHOLDER)}
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center bg-slate-100 text-foreground-secondary font-semibold border border-slate-200 rounded-full hover:bg-white hover:border-slate-300 text-xs">
                          {getUserInitials(user?.name || "", user?.mobile)}
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={6} className="w-56 rounded-xl shadow-lg border-slate-100 p-1">
                    <DropdownMenuLabel className="font-normal p-3 bg-slate-50/50 rounded-t-xl mb-1">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none">{user?.name || "Esparex User"}</p>
                        <p className="text-xs text-muted-foreground">
                          {user?.mobile ? `****** ${user.mobile.slice(-4)}` : ""}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-100" />
                    {profileMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <DropdownMenuItem
                          key={item.id}
                          onClick={() => handleMenuItemClick(item)}
                          className="cursor-pointer rounded-lg focus:bg-slate-50"
                        >
                          <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{item.label}</span>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator className="bg-slate-100" />
                    <DropdownMenuItem
                      onClick={onLogout}
                      className="cursor-pointer rounded-lg text-red-600 focus:bg-red-50 focus:text-red-700"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => (onShowLogin ? onShowLogin() : navigateTo("login"))}>
                Login
              </Button>
            )}

            <Button
              size="sm"
              onClick={handlePostAdClick}
              disabled={!isBackendUp}
              className="rounded-full px-4 gap-2 shadow-sm hover:shadow-md transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              title={!isBackendUp ? "Service temporarily unavailable" : "Post a new ad"}
            >
              <TrendingUp className="h-4 w-4" /> Post Ad
            </Button>
          </div>
        </div>
      </header>

      {/* ── MOBILE HEADER (< MD) ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full glass shadow-premium md:hidden pt-[env(safe-area-inset-top)] relative">
        {/* Top Location Bar */}
        <div className="h-11 bg-slate-50/80 border-b border-slate-100 flex items-center px-4">
          <button
            type="button"
            className="flex items-center gap-2 mr-3 h-11"
            onClick={() => navigateTo("home")}
            aria-label="Go to homepage"
          >
            <Image
              src="/icons/logo.png"
              alt="Esparex"
              width={512}
              height={206}
              style={{ height: "28px", width: "auto" }}
            />
          </button>

          <div className="h-4 w-[1px] bg-slate-200 mx-2" />

          <button
            type="button"
            className="active:bg-slate-100 transition-colors flex items-center flex-1 min-w-0 text-left h-11"
            onClick={() => isMounted && setShowLocationSelector(true)}
            aria-label={
              headerLocationDetails.headerText
                ? `Change location. Current location: ${headerLocationDetails.headerText}`
                : "Open location selector"
            }
          >
            <MapPin className="h-3.5 w-3.5 text-blue-500 mr-1.5 flex-shrink-0" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground-tertiary">
              <span className={`block transition-opacity duration-200 ${isMounted ? "opacity-100" : "opacity-0"}`}>
                {isMounted ? resolvedHeaderLocation || DEFAULT_APP_LOCATION.display : DEFAULT_APP_LOCATION.display}
              </span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-foreground-subtle ml-1.5 flex-shrink-0" />
          </button>
        </div>

        {/* Main Header Row */}
        <div className={`flex items-center px-3 bg-white ${chromePolicy.showStickySearch ? "h-12 gap-2 border-b border-slate-100" : "h-14 gap-2"}`}>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-xl -ml-1 hover:bg-slate-100 text-foreground-secondary"
            aria-label="Open navigation menu"
            onClick={() => setIsMobileDrawerOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {chromePolicy.showStickySearch ? (
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 h-11 text-left"
              aria-label={`Current search: ${stickySearchLabel}`}
            >
              <Search className="h-4 w-4 shrink-0 text-foreground-subtle" />
              <span className="truncate text-sm font-medium text-foreground-secondary">
                {stickySearchLabel}
              </span>
            </button>
          ) : (
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" />
              <Input
                className="w-full pl-9 h-11 bg-slate-100 border-transparent focus-visible:bg-white focus-visible:border-blue-300 focus-visible:ring-2 focus-visible:ring-blue-100 transition-all rounded-xl text-sm placeholder:text-foreground-subtle"
                placeholder="Search listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search listings"
              />
            </form>
          )}

          <div className="flex items-center gap-1">
            {!isLoggedIn && !isAuthLoading && (
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-xl text-link hover:bg-blue-50"
                onClick={onShowLogin}
                aria-label="Login"
              >
                <LogIn className="h-5 w-5" />
              </Button>
            )}

            {isLoggedIn && (
              <NotificationBellDropdown
                notificationsData={notificationsData}
                unreadCount={notifUnreadCount}
                onRefresh={refetchNotifications}
                variant="mobile"
              />
            )}
          </div>
        </div>

        {/* Mobile Location Sheet */}
        <Sheet open={showLocationSelector} onOpenChange={setShowLocationSelector}>
          <SheetContent
            side="bottom"
            className="h-[60vh] max-h-[440px] overflow-hidden rounded-t-2xl border-t-0 p-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl mx-auto max-w-sm w-full sm:h-[70vh] sm:max-h-[520px]"
          >
            <SheetTitle className="sr-only">Select Location</SheetTitle>
            <SheetDescription className="sr-only">Choose your city</SheetDescription>
            <LocationSelector variant="panel" onClose={() => setShowLocationSelector(false)} />
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
}
