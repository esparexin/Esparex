"use client";

import { useMobileNavDrawer } from "./MobileNavDrawerProvider";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LogOut, LogIn } from "lucide-react";
import { getUserInitials } from "@/utils/headerUtils";
import { useRouter } from "next/navigation";
import { getNavigationItems, getNavigationSections, type ResolvedNavigationItem } from "@/config/navigation";
import type { User } from "@/types/User";
import type { UserPage } from "@/lib/routeUtils";

interface MobileNavDrawerProps {
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  user: User | null;
  onShowLogin: () => void;
  onLogout: () => void;
  navigateTo: (page: UserPage) => void;
}

export function MobileNavDrawer({
  isLoggedIn,
  isAuthLoading,
  user,
  onShowLogin,
  onLogout,
  navigateTo,
}: MobileNavDrawerProps) {
  const router = useRouter();
  const { isOpen, setIsOpen, close } = useMobileNavDrawer();

  const handleNav = (page: UserPage) => {
    navigateTo(page);
    close();
  };

  const drawerItems = getNavigationItems("mobile-drawer", { isLoggedIn, user });
  const { main: mainNavItems, account: accountNavItems } = getNavigationSections(drawerItems);
  const visibleDrawerItems = isLoggedIn ? accountNavItems : mainNavItems;

  const handleNavigationItemClick = (item: ResolvedNavigationItem) => {
    if (item.href) {
      void router.push(item.href);
      close();
      return;
    }
    if (item.page) {
      handleNav(item.page);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="left" className="w-[85%] max-w-[320px] p-0 border-r-0 bg-background opacity-100 shadow-2xl transform-gpu">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetDescription className="sr-only">Access site navigation</SheetDescription>
        
        <div className="flex flex-col h-full bg-background relative z-50">
          <div
            className="p-6 bg-primary text-primary-foreground cursor-pointer active:opacity-90 transition-opacity"
            onClick={() => isLoggedIn && handleNav('profile-settings')}
          >
            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center font-bold text-xl border-2 border-white/20">
                  {getUserInitials(user?.name || "")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg truncate">{user?.name}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Welcome to Esparex</h2>
                {!isAuthLoading ? (
                  <Button
                    variant="secondary"
                    className="w-full justify-start gap-2 h-11 font-semibold text-primary"
                    onClick={() => { close(); onShowLogin(); }}
                  >
                    <LogIn className="h-4 w-4" /> Login / Sign Up
                  </Button>
                ) : (
                  <p className="text-sm text-primary-foreground/90">Checking session...</p>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
            <h3 className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
              {isLoggedIn ? "Account" : "Navigation"}
            </h3>
            {visibleDrawerItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="w-full justify-start gap-4 h-12 text-base font-medium"
                  onClick={() => handleNavigationItemClick(item)}
                >
                  <Icon className="h-5 w-5 text-muted-foreground" /> {item.label}
                </Button>
              );
            })}

            {isLoggedIn && (
              <>
                <div className="h-px bg-border my-4" />
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-4 h-12 text-base font-medium text-destructive hover:text-destructive hover:bg-destructive/5"
                  onClick={() => { close(); onLogout(); }}
                >
                  <LogOut className="h-5 w-5" /> Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
