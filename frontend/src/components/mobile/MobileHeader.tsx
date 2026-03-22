"use client";
import { getHeaderLocationText } from "@/lib/location/locationService";
import { Menu, MapPin, Bell, Search, LogIn, ChevronDown } from "lucide-react";
import { useEffect } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import LocationSelector from "@/components/location/LocationSelector";
import LocationFirstVisitPrompt from "@/components/location/LocationFirstVisitPrompt";
import LocationPermissionBlockedModal from "@/components/location/LocationPermissionBlockedModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocationSelector } from "@/hooks/useLocationSelector";
import { useHeaderSearch } from "@/hooks/useHeaderSearch";
import { useMobileNavDrawer } from "@/components/mobile/MobileNavDrawerProvider";
import { useMounted } from "@/hooks/useMounted";
import { useLocationState, useLocationDispatch } from "@/context/LocationContext";
import type { UserPage } from "@/lib/routeUtils";
import { usePathname } from "next/navigation";
import { getMobileChromePolicy } from "@/lib/mobile/chromePolicy";
import { useNotificationsQuery } from "@/queries";
import { useNotificationSync } from "@/hooks/useNotificationSync";
interface MobileHeaderProps {
    navigateTo: (page: UserPage, adId?: string | number, category?: string, businessId?: string) => void;
    isLoggedIn: boolean;
    isAuthLoading?: boolean;
    onShowLogin: () => void;
    onSearch?: (query: string) => void;
}


export default function MobileHeader({ navigateTo, isLoggedIn, isAuthLoading = false, onShowLogin, onSearch }: MobileHeaderProps) {
    const pathname = usePathname();
    const { isOpen, setIsOpen } = useMobileNavDrawer();
    const isMounted = useMounted();
    const { shouldShowFirstVisitPrompt, showPermissionBlockedModal } = useLocationState();
    const { detectLocation, dismissFirstVisitPrompt, dismissPermissionBlockedModal } = useLocationDispatch();
    const chromePolicy = getMobileChromePolicy(pathname);

    const { data: notificationsData } = useNotificationsQuery({ enabled: isLoggedIn });
    const notifUnreadCount = typeof notificationsData?.unreadCount === 'number' ? notificationsData.unreadCount : 0;
    
    useNotificationSync({ enabled: isLoggedIn });

    // Use shared hooks
    const {
        showLocationSelector,
        setShowLocationSelector,
        globalLocation: location
    } = useLocationSelector({ mode: "header" });
    const resolvedHeaderLocation = getHeaderLocationText(location).headerText || "Select Location";

    const {
        searchQuery,
        setSearchQuery,
        handleSearch
    } = useHeaderSearch({
        onSearch,
        // Mobile uses handleSearchSubmit from form, which manually calls this
    });

    // Handle mobile back button
    useEffect(() => {
        const handlePopState = () => {
            if (isOpen) setIsOpen(false);
            if (showLocationSelector) setShowLocationSelector(false);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isOpen, showLocationSelector, setShowLocationSelector, setIsOpen]);

    const handleSearchSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        handleSearch();
    };

    return (
        <>
            <header className="sticky top-0 z-50 w-full bg-background shadow-sm md:hidden font-inter pt-[env(safe-area-inset-top)]">
                {/* 1. Top Location Bar (44px) */}
                <div className="h-11 bg-muted/30 border-b flex items-center px-4">
                    <button
                        type="button"
                        className="flex items-center gap-1.5 mr-3"
                        onClick={() => navigateTo('home')}
                        aria-label="Go to homepage"
                    >
                        <div className="h-6 w-6 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-sm">E</div>
                        <span className="font-bold text-sm text-slate-900 leading-none">Esparex</span>
                    </button>

                    <div className="h-4 w-[1px] bg-border mx-1"></div>

                    <button
                        type="button"
                        className="active:bg-muted/50 transition-colors flex items-center flex-1 min-w-0 text-left ml-1"
                        onClick={() => isMounted && setShowLocationSelector(true)}
                        aria-label="Open location selector"
                    >
                        <MapPin className="h-3.5 w-3.5 text-primary mr-1.5" />
                        <span className="text-sm font-medium truncate flex-1 text-foreground/80 max-w-[200px]">
                            <span className={`block transition-opacity duration-200 ${isMounted ? "opacity-100" : "opacity-0"}`}>
                                {isMounted && location.source !== 'default'
                                    ? resolvedHeaderLocation
                                    : "Select Location"}
                            </span>
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-2" />
                    </button>
                </div>

                {isMounted && shouldShowFirstVisitPrompt && !showLocationSelector && (
                    <div className="border-b bg-background px-3 py-3">
                        <LocationFirstVisitPrompt
                            onUseCurrentLocation={() => {
                                void detectLocation(true, true).then((detected) => {
                                    if (!detected) {
                                        setShowLocationSelector(true);
                                    }
                                });
                            }}
                            onChooseManually={() => {
                                dismissFirstVisitPrompt();
                                setShowLocationSelector(true);
                            }}
                            onDismiss={dismissFirstVisitPrompt}
                        />
                    </div>
                )}

                {/* 2. Main Header (56px) - Menu, Search, Bell */}
                <div className={`h-14 flex items-center px-3 bg-background ${chromePolicy.showStickySearch ? "justify-between" : "gap-3"}`}>
                    {/* Hamburger Menu (Left) */}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full -ml-2 hover:bg-muted" 
                        aria-label="Open navigation menu"
                        onClick={() => setIsOpen(true)}
                    >
                        <Menu className="h-6 w-6 text-foreground" />
                    </Button>

                    {/* Search Input */}
                    {!chromePolicy.showStickySearch && (
                        <form onSubmit={handleSearchSubmit} className="flex-1 relative mx-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                className="w-full pl-9 h-10 bg-muted/40 border-transparent focus:bg-background focus:border-primary/30 transition-all rounded-full text-base"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                aria-label="Search listings"
                            />
                        </form>
                    )}

                    {/* Mobile Header Icons */}
                    <div className={`flex items-center gap-1 ${chromePolicy.showStickySearch ? "" : "pl-1"}`}>
                        {!isLoggedIn && !isAuthLoading && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full text-primary hover:bg-muted"
                                onClick={onShowLogin}
                                aria-label="Login"
                            >
                                <LogIn className="h-5 w-5" />
                            </Button>
                        )}

                        {isLoggedIn && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full hover:bg-muted relative"
                                onClick={() => navigateTo('notifications')}
                                aria-label="Open notifications"
                            >
                                <Bell className="h-6 w-6 text-foreground/80" />
                                {notifUnreadCount > 0 && (
                                    <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-background" />
                                )}
                            </Button>
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

                {/* Location Permission Blocked Modal */}
                <LocationPermissionBlockedModal
                    isOpen={showPermissionBlockedModal}
                    onDismiss={dismissPermissionBlockedModal}
                    onUseManualLocation={() => {
                        setShowLocationSelector(true);
                    }}
                    onOpenBrowserSettings={() => {
                        dismissPermissionBlockedModal();
                    }}
                />
            </header>


        </>
    );
}
