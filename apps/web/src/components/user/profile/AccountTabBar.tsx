"use client";

import { useMemo } from "react";
import { BottomNavigation, MoreHorizontal } from "@esparex/ui";
import {
  PROFILE_TAB_ITEMS,
  PRIMARY_PROFILE_TABS,
  resolveBottomNavActiveTab,
  type ProfileTabValue,
} from "@/config/navigation";

interface AccountTabBarProps {
  activeTab: ProfileTabValue;
  onTabChange: (tab: ProfileTabValue) => void;
  unreadCount?: number;
}

/**
 * Account tab bar, composed on the canonical `BottomNavigation` from
 * `@esparex/ui`:
 * - primary tabs from the navigation SSOT, secondary tabs collapse to "more"
 * - unread badge on the messages tab (pre-formatted, capped at 99+)
 *
 * Rendered by `ProfileSettingsSidebar`; a tab-bar sub-section, not a
 * competing viewport implementation.
 */
export function AccountTabBar({
  activeTab,
  onTabChange,
  unreadCount = 0,
}: AccountTabBarProps) {
  const navigation = useMemo(
    () => ({
      primary: [
        ...PRIMARY_PROFILE_TABS.map((val) => {
          const found = PROFILE_TAB_ITEMS.find((item) => item.value === val);
          return {
            id: val,
            label:
              val === "mylistings"
                ? "Listings"
                : val === "smartalerts"
                  ? "Alerts"
                  : (found?.label ?? val),
            href: `#${val}`,
            icon: found?.icon ?? MoreHorizontal,
            badge:
              val === "messages" && unreadCount > 0
                ? unreadCount > 99
                  ? "99+"
                  : unreadCount
                : undefined,
          };
        }),
        { id: "more", label: "More", href: "#more", icon: MoreHorizontal },
      ],
    }),
    [unreadCount]
  );

  return (
    <BottomNavigation
      navigation={navigation}
      ariaLabel="Mobile account navigation"
      className="fixed inset-x-0 bottom-0 z-40 bg-background/95 backdrop-blur-md md:hidden"
      onSelectItem={(item) => onTabChange(item.id as ProfileTabValue)}
      isItemActive={(item) => resolveBottomNavActiveTab(activeTab) === item.id}
    />
  );
}
