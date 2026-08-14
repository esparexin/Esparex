"use client";

import type { User } from "@/types/User";
import { PROFILE_TAB_ITEMS, type ProfileTabValue } from "@/config/navigation";
import { LogOut } from "@/icons/IconRegistry";
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
    <div className="block md:hidden w-full bg-white divide-y divide-slate-100">
      <div className="py-1" role="list">
        <AccountNavItemList
          items={PROFILE_TAB_ITEMS}
          activeTab="more"
          onTabChange={onTabChange}
          renderTabBadge={renderTabBadge}
          variant="menu"
        />
      </div>

      <div className="p-1">
        <button
          type="button"
          onClick={() => { void onLogout(); }}
          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-left font-medium text-sm text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
