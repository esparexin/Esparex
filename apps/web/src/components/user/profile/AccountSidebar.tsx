"use client";

import React from "react";
import { Button, Crown } from "@esparex/ui";
import { AccountNavItemList } from "../AccountNavItemList";
import type { ProfileTabItem, ProfileTabValue } from "@/config/navigation";
import type { ProfileUser } from "./types";

interface AccountSidebarProps {
  items: ProfileTabItem[];
  activeTab: ProfileTabValue;
  onTabChange: (tab: ProfileTabValue) => void;
  renderTabBadge: (tab: ProfileTabValue) => React.ReactNode;
  onLogout: () => void;
  user: ProfileUser | null;
}

export function AccountSidebar({
  items,
  activeTab,
  onTabChange,
  renderTabBadge,
  onLogout,
  user,
}: AccountSidebarProps) {
  return (
    <aside className="hidden md:block space-y-1" aria-label="Account navigation">
      <div className="rounded-xl border border-border bg-card p-2 shadow-sm">
        <AccountNavItemList
          items={items}
          activeTab={activeTab}
          onTabChange={onTabChange}
          renderTabBadge={renderTabBadge}
          onLogout={onLogout}
          variant="sidebar"
        />
      </div>

      <div className="mt-3 p-3.5 rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-tiny font-bold text-muted-foreground uppercase tracking-wider">Current Plan</p>
            <p className="text-body font-bold text-foreground flex items-center gap-1.5 mt-0.5">
              <Crown className="h-3.5 w-3.5 text-warning fill-warning" />
              <span>{user?.plan || "Free"}</span>
            </p>
          </div>
          {(!user?.plan || user.plan === "Free") && (
            <Button
              type="button"
              onClick={() => onTabChange("buyplans")}
              size="sm"
              className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-caption font-semibold shadow-sm"
            >
              Upgrade
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
