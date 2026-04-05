"use client";

import { useMobileNavDrawer } from "./MobileNavDrawerProvider";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LogOut, LogIn } from "lucide-react";
import { getUserInitials } from "@/lib/headerUtils";
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
      <SheetContent side="left" className="w-[82%] max-w-[300px] p-0 border-r-0 bg-white shadow-2xl transform-gpu">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetDescription className="sr-only">Access site navigation</SheetDescription>

        <div className="flex flex-col h-full relative z-50">
          {/* Header */}
          <div
            className="px-5 py-6 bg-slate-900 cursor-pointer active:opacity-90 transition-opacity"
            onClick={() => isLoggedIn && handleNav('profile-settings')}
          >
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-900/30">
                  {getUserInitials(user?.name || "")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base text-white truncate">{user?.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">View profile</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-base mb-3 shadow-lg shadow-blue-900/30">E</div>
                  <h2 className="text-lg font-bold text-white">Welcome to Esparex</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Buy & sell mobile spares</p>
                </div>
                {!isAuthLoading ? (
                  <Button
                    variant="secondary"
                    className="w-full justify-start gap-2 h-11 font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl"
                    onClick={() => { close(); onShowLogin(); }}
                  >
                    <LogIn className="h-4 w-4" /> Login / Sign Up
                  </Button>
                ) : (
                  <p className="text-sm text-slate-400">Checking session...</p>
                )}
              </div>
            )}
          </div>

          {/* Nav Items */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              {isLoggedIn ? "Account" : "Navigation"}
            </p>
            {visibleDrawerItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-11 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl"
                  onClick={() => handleNavigationItemClick(item)}
                >
                  <Icon className="h-4.5 w-4.5 text-slate-400 flex-shrink-0" /> {item.label}
                </Button>
              );
            })}

            {isLoggedIn && (
              <>
                <div className="h-px bg-slate-100 my-3 mx-2" />
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-11 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                  onClick={() => { close(); onLogout(); }}
                >
                  <LogOut className="h-4 w-4 flex-shrink-0" /> Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
