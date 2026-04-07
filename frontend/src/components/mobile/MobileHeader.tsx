"use client";
import Image from "next/image";
import { Menu, MapPin, Search, LogIn, ChevronDown } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import LocationSelector from "@/components/location/LocationSelector";
import { HeaderLocationPrompts } from "@/components/location/HeaderLocationPrompts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMobileNavDrawer } from "@/components/mobile/MobileNavDrawerProvider";
import { useMounted } from "@/hooks/useMounted";

import type { UserPage } from "@/lib/routeUtils";
import { usePathname, useSearchParams } from "next/navigation";
import { getMobileChromePolicy } from "@/lib/mobile/chromePolicy";
import { useSharedHeaderLogic } from "@/components/user/hooks/useSharedHeaderLogic";
import { NotificationBellDropdown } from "@/components/user/NotificationBellDropdown";
import { parsePublicBrowseParams } from "@/lib/publicBrowseRoutes";
interface MobileHeaderProps {
    navigateTo: (page: UserPage, adId?: string | number, category?: string, businessId?: string) => void;
    isLoggedIn: boolean;
    isAuthLoading?: boolean;
    onShowLogin: () => void;
    onSearch?: (query: string) => void;
}


export default function MobileHeader({ navigateTo, isLoggedIn, isAuthLoading = false, onShowLogin, onSearch }: MobileHeaderProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { isOpen, setIsOpen } = useMobileNavDrawer();
    const isMounted = useMounted();
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

    const {
        notificationsData,
        notifUnreadCount,
        refetchNotifications,
        showLocationSelector,
        setShowLocationSelector,
        headerLocationDetails,
        resolvedHeaderLocation,
        searchQuery,
        setSearchQuery,
        handleSearchSubmit,
    } = useSharedHeaderLogic({ isLoggedIn, onSearch });

    // Handle mobile back button
    useEffect(() => {
        const handlePopState = () => {
            if (isOpen) setIsOpen(false);
            if (showLocationSelector) setShowLocationSelector(false);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isOpen, showLocationSelector, setShowLocationSelector, setIsOpen]);

    return (
        <>
            <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md shadow-[0_1px_12px_rgba(0,0,0,0.06)] md:hidden font-inter pt-[env(safe-area-inset-top)] relative">
                {/* 1. Top Location Bar (44px) */}
                <div className="h-11 bg-slate-50/80 border-b border-slate-100 flex items-center px-4">
                    <button
                        type="button"
                        className="flex items-center gap-2 mr-3"
                        onClick={() => navigateTo('home')}
                        aria-label="Go to homepage"
                    >
                        <Image
                            src="/icons/logo.png"
                            alt="Esparex"
                            width={512}
                            height={206}
                            style={{ height: '28px', width: 'auto' }}
                        />
                    </button>

                    <div className="h-4 w-[1px] bg-slate-200 mx-2"></div>

                    <button
                        type="button"
                        className="active:bg-slate-100 transition-colors flex items-center flex-1 min-w-0 text-left"
                        onClick={() => isMounted && setShowLocationSelector(true)}
                        aria-label={headerLocationDetails.headerText
                            ? `Change location. Current location: ${headerLocationDetails.headerText}`
                            : "Open location selector"}
                        title={headerLocationDetails.tooltipText || resolvedHeaderLocation}
                    >
                        <MapPin className="h-3.5 w-3.5 text-blue-500 mr-1.5 flex-shrink-0" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-600">
                            <span className={`block transition-opacity duration-200 ${isMounted ? "opacity-100" : "opacity-0"}`}>
                                {isMounted ? (resolvedHeaderLocation || "India") : "India"}
                            </span>
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1.5 flex-shrink-0" />
                    </button>
                </div>

                <HeaderLocationPrompts
                    isMounted={isMounted}
                    showLocationSelector={showLocationSelector}
                    setShowLocationSelector={setShowLocationSelector}
                    firstVisitWrapperClassName="pointer-events-none absolute inset-x-0 top-full z-[60] px-3 pt-3"
                    firstVisitPromptClassName="pointer-events-auto border-slate-200 bg-white/98 shadow-[0_18px_45px_rgba(15,23,42,0.16)]"
                />

                {/* 2. Main Header (56px) - Menu, Search, Bell */}
                <div className={`flex items-center px-3 bg-white ${chromePolicy.showStickySearch ? "h-12 gap-2 border-b border-slate-100" : "h-14 gap-2"}`}>
                    {/* Hamburger Menu (Left) */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 rounded-xl -ml-1 hover:bg-slate-100 text-slate-700"
                        aria-label="Open navigation menu"
                        onClick={() => setIsOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>

                    {/* Search Input */}
                    {chromePolicy.showStickySearch ? (
                        <button
                            type="button"
                            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                            className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-left"
                            aria-label={`Current search: ${stickySearchLabel}`}
                        >
                            <Search className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="truncate text-sm font-medium text-slate-700">
                                {stickySearchLabel}
                            </span>
                        </button>
                    ) : (
                        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                className="w-full pl-9 h-11 bg-slate-100 border-transparent focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all rounded-xl text-sm placeholder:text-slate-400"
                                placeholder="Search listings..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                aria-label="Search listings"
                            />
                        </form>
                    )}

                    {/* Mobile Header Icons */}
                    <div className={`flex items-center gap-1 ${chromePolicy.showStickySearch ? "" : ""}`}>
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

                {/* Location Picker Sheet */}
                <Sheet open={showLocationSelector} onOpenChange={setShowLocationSelector}>
                    <SheetContent side="bottom" className="h-[90vh] p-0 rounded-t-2xl border-t-0 shadow-2xl">
                        <SheetTitle className="sr-only">Select Location</SheetTitle>
                        <SheetDescription className="sr-only">Choose your city</SheetDescription>
                        <LocationSelector onClose={() => setShowLocationSelector(false)} />
                    </SheetContent>
                </Sheet>
            </header>


        </>
    );
}
