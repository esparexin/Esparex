"use client";

import type { User } from "@/types/User";
import { PROFILE_TAB_ITEMS, type ProfileTabValue } from "@/config/navigation";
import { Card } from "@/components/ui/card";
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
    <div className="space-y-4 block md:hidden w-full">
      {/* Navigation List */}
      <Card className="p-2 border-0 shadow-sm bg-white">
        <div className="space-y-1" role="list">
          <AccountNavItemList
            items={PROFILE_TAB_ITEMS}
            activeTab="more"
            onTabChange={onTabChange}
            renderTabBadge={renderTabBadge}
            variant="menu"
          />
        </div>

        <div className="my-2 border-t border-slate-100" />

        <button
          type="button"
          onClick={() => { void onLogout(); }}
          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left font-semibold text-sm text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </Card>
    </div>
  );
}
