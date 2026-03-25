"use client";
import { HeaderLocation } from "../layout/HeaderLocation";
import { User } from "@/types/User";
import { getUserInitials } from "@/lib/headerUtils";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Search,
  Clock,
  TrendingUp,
  Building2,
  Bell,
  LayoutDashboard,
  LogOut,
} from "@/icons/IconRegistry";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import type { UserPage } from "@/lib/routeUtils";
import {
  getNavigationItems,
  getNavigationSections,
  type ResolvedNavigationItem,
} from "@/config/navigation";

import LocationSelector from "../location/LocationSelector";
import { HeaderLocationPrompts } from "../location/HeaderLocationPrompts";


interface UserHeaderProps {
  currentPage: string;
  navigateTo: (page: UserPage, adId?: number, category?: string, sellerIdOrBusinessId?: string, serviceId?: string, sellerId?: string, sellerType?: "business" | "individual") => void;
  isLoggedIn: boolean;
  isAuthLoading?: boolean;
  onLogout: () => void;
  user: User | null;
  onSearch?: (query: string) => void;
  onShowLogin?: () => void;
}

const recentSearches = ["iPhone 14 Pro", "Samsung Galaxy", "MacBook Pro", "iPad Air"];

import { useSharedHeaderLogic } from "@/components/user/hooks/useSharedHeaderLogic";
import { usePostAdNavigation } from "@/hooks/usePostAdNavigation";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";
import { canRegisterBusiness } from "@/guards/businessGuards";
import { DEFAULT_IMAGE_PLACEHOLDER, toSafeImageSrc } from "@/lib/image/imageUrl";

export function UserHeader({ navigateTo, isLoggedIn, isAuthLoading = false, onLogout, user, onSearch, onShowLogin }: UserHeaderProps) {
  const router = useRouter();
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
    }
  });
  const pathname = usePathname();

  const shouldFetchHeaderNotifications =
    isLoggedIn &&
    !isAuthLoading &&
    !pathname.startsWith("/account/business/apply") &&
    !pathname.startsWith("/business/edit");

  const {
    notifUnreadCount,
    showLocationSelector,
    setShowLocationSelector,
    locationDropdownRef,
    searchQuery,
    setSearchQuery,
    showSearchDropdown,
    setShowSearchDropdown,
    searchRef,
    handleSearch,
    handleSearchFocus
  } = useSharedHeaderLogic({
    isLoggedIn,
    onSearch,
    navigateTo: (page) => navigateTo(page as UserPage),
    disableNotificationsFetch: !shouldFetchHeaderNotifications
  });

  const { account: profileMenuItems } = getNavigationSections(
    getNavigationItems("profile-dropdown", { isLoggedIn, user })
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

  // Close dropdowns on route change
  useEffect(() => {
    setShowLocationSelector(false);
    setShowSearchDropdown(false);
  }, [pathname, setShowLocationSelector, setShowSearchDropdown]);


  /**
   * ✅ HYDRATION SAFETY: Always render the SAME markup structure
   * Server & first client render must match to avoid hydration errors
   * Only conditionally render dynamic content AFTER mount
   */
  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-[999] w-full border-b bg-background/80 backdrop-blur-md shadow-sm hidden md:block font-inter">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-6">
          {/* Logo */}
          <button onClick={() => navigateTo("home")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">E</div>
            <span className="text-xl font-bold tracking-tight text-primary">Esparex</span>
          </button>

          {/* Location Pill */}
          <div className="relative" ref={locationDropdownRef}>
            <HeaderLocation onClick={() => { setShowLocationSelector(!showLocationSelector); setShowSearchDropdown(false); }} />

            <HeaderLocationPrompts
                isMounted={true}
                showLocationSelector={showLocationSelector}
                setShowLocationSelector={setShowLocationSelector}
                setShowSearchDropdown={setShowSearchDropdown}
                firstVisitWrapperClassName="absolute left-0 top-full z-[105] mt-3 w-[360px]"
            />

            {/* Location Dropdown */}
            <div
              className={`absolute top-full left-0 mt-2 w-96 max-h-[80vh] bg-popover border rounded-xl shadow-lg overflow-hidden transition-all duration-200 z-[110] flex flex-col ${showLocationSelector
                ? "opacity-100 visible translate-y-0"
                : "opacity-0 invisible -translate-y-2 pointer-events-none"
                } `}
              onClick={(e) => e.stopPropagation()} // 🛑 Critical: Prevent click bubbling to document listener
            >
              <div className="flex-1 overflow-hidden">
                {showLocationSelector ? (
                  <LocationSelector onClose={() => setShowLocationSelector(false)} />
                ) : null}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl relative" ref={searchRef}>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
              <Input
                id="header-global-search"
                className="pl-11 h-11 w-full bg-muted/50 border-border/50 focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all rounded-2xl shadow-sm text-base"
                placeholder="Search for mobiles, parts, services..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => { handleSearchFocus(); setShowLocationSelector(false); }}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            {showSearchDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[110] p-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-1">Recent</div>
                {recentSearches.map(s => (
                  <button key={s} onClick={() => handleSearch(s)} className="w-full text-left px-2 py-2 hover:bg-muted rounded flex items-center gap-2 text-sm">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 ml-auto">
            {isLoggedIn && (
              <Button
                variant="ghost"
                size="sm"
                className={`hidden lg:flex gap-2 ${businessStatus === 'live' ? 'text-primary font-semibold' : 'text-muted-foreground'
                  } hover:text-foreground`}
                onClick={() => {
                  if (businessStatus === 'live' || shouldShowPendingReview || !canRegister) {
                    navigateTo('business-entry');
                  } else {
                    navigateTo('business-register');
                  }
                }}
              >
                {businessStatus === 'live' ? (
                  <>
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden xl:inline">Business Hub</span>
                  </>
                ) : shouldShowPendingReview ? (
                  <>
                    <Building2 className="h-4 w-4 text-amber-500" />
                    <span className="hidden xl:inline text-amber-600">Pending Review</span>
                  </>
                ) : businessStatus === 'rejected' ? (
                  <>
                    <Building2 className="h-4 w-4 text-red-500" />
                    <span className="hidden xl:inline text-red-600">Fix Application</span>
                  </>
                ) : canRegister ? (
                  <>
                    <Building2 className="h-4 w-4" />
                    <span className="hidden xl:inline">Register Business</span>
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4" />
                    <span className="hidden xl:inline">Business Hub</span>
                  </>
                )}
              </Button>
            )}


            {isLoggedIn && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full relative text-muted-foreground hover:text-foreground"
                onClick={() => navigateTo('notifications')}
                aria-label={notifUnreadCount > 0 ? `${notifUnreadCount} unread notifications` : 'Notifications'}
              >
                <Bell className="h-5 w-5" />
                {notifUnreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-background">
                    {notifUnreadCount > 99 ? '99+' : notifUnreadCount}
                  </span>
                )}
              </Button>
            )}

            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full h-8 w-8 flex-shrink-0 border-none hover:bg-transparent p-0 overflow-hidden ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    title="Account Menu"
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
                      <div className="flex h-8 w-8 items-center justify-center bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-full hover:bg-white hover:border-slate-300">
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
                        {user?.mobile ? `****** ${user.mobile.slice(-4)} ` : ""}
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
                        <Icon className="mr-2 h-4 w-4 text-slate-500" />
                        <span>{item.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator className="bg-slate-100" />
                  <DropdownMenuItem onClick={onLogout} className="cursor-pointer rounded-lg text-red-600 focus:bg-red-50 focus:text-red-700">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : !isAuthLoading ? (
              <Button variant="ghost" size="sm" onClick={() => onShowLogin ? onShowLogin() : navigateTo("login")}>Login</Button>
            ) : (
              <div className="h-9 w-16" aria-hidden="true" />
            )}

            <Button
              size="sm"
              onClick={handlePostAdClick}
              disabled={!isBackendUp}
              className="rounded-full px-4 gap-2 shadow-sm hover:shadow-md transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              title={!isBackendUp ? "Service temporary unavailable" : "Post a new ad"}
            >
              <TrendingUp className="h-4 w-4" /> Post Ad
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Location Search Overlay - Removed in favor of MobileHeader's LocationSelector */}

      {/* Mobile Location Search Overlay - Removed in favor of MobileHeader's LocationSelector */}
    </>
  );
}
