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
      <div className="rounded-xl border border-border bg-card p-2 shadow-xs">
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
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors hover:bg-destructive/10 text-destructive font-medium text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
        >
          <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
          <span>Log out</span>
        </button>
      </div>

      <div className="mt-3 p-3.5 rounded-xl border border-border bg-card shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-tiny font-bold text-muted-foreground uppercase tracking-wider">Current Plan</p>
            <p className="text-body font-bold text-foreground flex items-center gap-1.5 mt-0.5">
              <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span>{user?.plan || "Free"}</span>
            </p>
          </div>
          {(!user?.plan || user.plan === "Free") && (
            <Button
              type="button"
              onClick={() => onTabChange("plans")}
              size="sm"
              className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-caption font-semibold shadow-xs"
            >
              Upgrade
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
