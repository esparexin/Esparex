"use client";

import type { User } from "@esparex/contracts";
import { PROFILE_TAB_ITEMS, type ProfileTabValue } from "@/config/navigation";
import { AccountNavItemList } from "../../AccountNavItemList";

interface MoreMenuTabProps {
  user: (User & { plan?: string }) | null;
  onTabChange: (tab: ProfileTabValue) => void;
  onLogout: () => void | Promise<void>;
  renderTabBadge: (tab: ProfileTabValue) => React.ReactNode;
}

export function MoreMenuTab({
  user: _user,
  onTabChange,
  onLogout,
  renderTabBadge,
}: MoreMenuTabProps) {
  return (
    <div className="block md:hidden w-full bg-card">
      <div className="py-1" role="list">
        <AccountNavItemList
          items={PROFILE_TAB_ITEMS}
          activeTab="more"
          onTabChange={onTabChange}
          renderTabBadge={renderTabBadge}
          onLogout={onLogout}
          variant="menu"
        />
      </div>
    </div>
  );
}
