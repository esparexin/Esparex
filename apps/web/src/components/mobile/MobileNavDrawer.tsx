"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useMobileNavDrawer } from "./MobileNavDrawerProvider";

import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  LogIn,
} from "@esparex/ui";
import { getUserInitials } from "@/lib/headerUtils";
import { toSafeImageSrc, DEFAULT_IMAGE_PLACEHOLDER } from "@/lib/image/imageUrl";
import { useRouter } from "next/navigation";
import { getNavigationItems, getNavigationSections, type ResolvedNavigationItem } from "@/config/navigation";
import type { User } from "@esparex/contracts";
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

  const [imgErrPhoto, setImgErrPhoto] = useState<string | null>(null);
  const safeProfilePhoto = useMemo(
    () => toSafeImageSrc(user?.profilePhoto, ""),
    [user?.profilePhoto]
  );
  const hasValidPhoto = Boolean(safeProfilePhoto && imgErrPhoto !== safeProfilePhoto);
  const avatarSrc = hasValidPhoto ? safeProfilePhoto : DEFAULT_IMAGE_PLACEHOLDER;

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
      <SheetContent side="left" inert={!isOpen || undefined} className="w-[82%] max-w-[300px] p-0 border-r-0 bg-card text-card-foreground shadow-2xl transform-gpu">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetDescription className="sr-only">Access site navigation</SheetDescription>

        <div className="flex flex-col h-full relative z-50">
          {/* Header */}
          <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-5 bg-foreground text-background">
            <div className="mb-4">
              <Image
                src="/icons/logo.png"
                alt="Esparex"
                width={495}
                height={112}
                unoptimized
                className="h-6 w-auto"
              />
            </div>

            {isLoggedIn ? (
              <div
                className="flex items-center gap-3 cursor-pointer active:opacity-90 transition-opacity"
                onClick={() => {
                  void router.push('/account/profile');
                  close();
                }}
              >
                <div className="h-12 w-12 rounded-2xl bg-primary overflow-hidden flex items-center justify-center font-bold text-h4 text-primary-foreground shadow-lg shadow-black/20 shrink-0 relative">
                  {hasValidPhoto ? (
                    <Image
                      src={avatarSrc}
                      alt={user?.name || "Profile"}
                      width={48}
                      height={48}
                      unoptimized
                      className="h-full w-full object-cover"
                      onError={() => setImgErrPhoto(safeProfilePhoto)}
                    />
                  ) : (
                    getUserInitials(user?.name || "")
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-body-lg text-white truncate">{user?.name}</p>
                  <p className="text-caption text-foreground-subtle mt-0.5">Edit profile</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <h2 className="text-h4 font-bold text-white">Welcome to Esparex</h2>
                  <p className="text-caption text-foreground-subtle mt-0.5">Buy & sell mobile spares</p>
                </div>
                {!isAuthLoading ? (
                  <Button
                    variant="secondary"
                    className="w-full justify-start gap-2 h-11 font-semibold text-foreground bg-white hover:bg-muted rounded-xl cursor-pointer"
                    onClick={() => {
                      close();
                      setTimeout(() => onShowLogin(), 320);
                    }}
                  >
                    <LogIn className="h-4 w-4" /> Login / Sign Up
                  </Button>
                ) : (
                  <p className="text-body text-foreground-subtle">Checking session...</p>
                )}
              </div>
            )}
          </div>

          {/* Nav Items */}
          <div className="flex-1 overflow-y-auto px-3 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-0.5">
            <p className="px-3 text-tiny font-bold text-foreground-subtle uppercase tracking-widest mb-2">
              {isLoggedIn ? "Account" : "Navigation"}
            </p>
            {visibleDrawerItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className="w-full justify-start px-3 h-11 text-body font-medium text-foreground-secondary hover:bg-muted hover:text-foreground rounded-xl cursor-pointer"
                onClick={() => handleNavigationItemClick(item)}
              >
                {item.label}
              </Button>
            ))}

            {isLoggedIn && (
              <>
                <div className="h-px bg-border my-2.5 mx-2" />
                <Button
                  variant="ghost"
                  className="w-full justify-start px-3 h-11 text-body font-medium text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer"
                  onClick={() => {
                    close();
                    setTimeout(() => onLogout(), 320);
                  }}
                >
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
