"use client";

/**
 * @deprecated Migrated to the canonical `BottomNavigation` from `@esparex/ui`
 * (P1-1 — single bottom-navigation implementation per DECISION-GATE §3).
 * The live composition now lives in `ProfileSettingsSidebar.tsx`.
 *
 * This module is frozen for compatibility (including `resolveBottomNavActiveTab`,
 * asserted by navigation SSOT tests) and will be deleted in Phase 4
 * (DECISION-GATE §4). Do not import from here in new code.
 */


import { useMemo } from "react";
import {
  PROFILE_TAB_ITEMS,
  PRIMARY_PROFILE_TABS,
  resolveBottomNavActiveTab,
  type ProfileTabValue,
} from "@/config/navigation";
import { MoreHorizontal } from "@esparex/ui";

export { resolveBottomNavActiveTab };

interface MobileAccountBottomNavProps {
  activeTab: ProfileTabValue;
  onTabChange: (tab: ProfileTabValue) => void;
  unreadCount?: number;
}

export function MobileAccountBottomNav({ activeTab, onTabChange, unreadCount = 0 }: MobileAccountBottomNavProps) {
  const resolvedActiveTab = resolveBottomNavActiveTab(activeTab);

  const items = useMemo(() => [
    ...PRIMARY_PROFILE_TABS.map((val) => {
      const found = PROFILE_TAB_ITEMS.find((item) => item.value === val);
      return {
        value: val,
        label: val === "mylistings" ? "Listings" : val === "smartalerts" ? "Alerts" : found?.label ?? val,
        icon: found?.icon ?? MoreHorizontal,
        badge: val === "messages" ? unreadCount : undefined,
      };
    }),
    { value: "more" as ProfileTabValue, label: "More", icon: MoreHorizontal, badge: undefined },
  ], [unreadCount]);

  return (
    <nav
      aria-label="Mobile account navigation"
      className="fixed bottom-0 left-0 right-0 z-40 h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-background/95 backdrop-blur-md border-t border-border flex md:hidden items-center justify-around px-1"
    >
      {items.map(({ value, label, icon: Icon, badge }) => {
        const isActive = resolvedActiveTab === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onTabChange(value)}
            aria-current={isActive ? "page" : undefined}
            className={`flex-1 flex flex-col items-center justify-center min-h-[44px] py-1 transition-all rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isActive ? "text-primary font-semibold" : "text-foreground-subtle hover:text-foreground-secondary font-normal"
            }`}
          >
            <div className="relative">
              <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-foreground-subtle"}`} />
              {!!badge && badge > 0 && (
                <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-tiny font-bold text-destructive-foreground shadow-2xs">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </div>
            <span className="text-tiny mt-0.5 tracking-tight truncate max-w-[64px]">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
