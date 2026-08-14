"use client";

import React from "react";
import { Button } from "@esparex/ui";
import { Separator } from "@/components/ui/separator";
import { Crown, LogOut } from "@/icons/IconRegistry";
import { AccountNavItemList } from "../AccountNavItemList";
import type { ProfileTabItem, ProfileTabValue } from "@/config/navigation";
import type { ProfileUser } from "./types";

interface AccountDesktopSidebarProps {
  items: ProfileTabItem[];
  activeTab: ProfileTabValue;
  onTabChange: (tab: ProfileTabValue) => void;
  renderTabBadge: (tab: ProfileTabValue) => React.ReactNode;
  onLogout: () => void;
  user: ProfileUser | null;
}

export function AccountDesktopSidebar({
  items,
  activeTab,
  onTabChange,
  renderTabBadge,
  onLogout,
  user,
}: AccountDesktopSidebarProps) {
  return (
    <aside className="hidden md:block space-y-1" aria-label="Account navigation">
      <div className="rounded-xl border border-slate-200/80 bg-white p-2 shadow-xs">
        <AccountNavItemList
          items={items}
          activeTab={activeTab}
          onTabChange={onTabChange}
          renderTabBadge={renderTabBadge}
          variant="sidebar"
        />
        <Separator className="my-2" />
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors hover:bg-red-50 text-red-600 font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
        >
          <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
          <span>Log out</span>
        </button>
      </div>

      <div className="mt-3 p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Current Plan</p>
            <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
              <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span>{user?.plan || "Free"}</span>
            </p>
          </div>
          {(!user?.plan || user.plan === "Free") && (
            <Button
              type="button"
              onClick={() => onTabChange("plans")}
              size="sm"
              className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
            >
              Upgrade
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
