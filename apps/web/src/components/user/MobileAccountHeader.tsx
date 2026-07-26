"use client";

import { ChevronLeft } from "@/components/ui/icons";
import { PROFILE_TAB_ITEMS, type ProfileTabValue } from "@/config/navigation";

interface MobileAccountHeaderProps {
  activeTab: ProfileTabValue;
  onBackToMenu: () => void;
}

export function MobileAccountHeader({ activeTab, onBackToMenu }: MobileAccountHeaderProps) {
  const isMenuTab = activeTab === "more";
  const currentTabItem = PROFILE_TAB_ITEMS.find((item) => item.value === activeTab);
  const title = isMenuTab ? "Account Management" : currentTabItem?.label || "Account";

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex md:hidden items-center justify-between px-3 h-14 w-full">
      <div className="flex items-center gap-2 min-w-0">
        {!isMenuTab && (
          <button
            type="button"
            onClick={onBackToMenu}
            aria-label="Back to Account Menu"
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        <h1 className="text-base font-bold text-slate-900 truncate">
          {title}
        </h1>
      </div>
    </header>
  );
}
