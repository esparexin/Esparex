"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Crown, ChevronRight, LogOut } from "@/components/ui/icons";
import { type LucideIcon } from "lucide-react";
import { type ProfileTabValue } from "@/config/navigation";
import type { ProfileUser } from "@/components/user/profile/types";
import { AccountHeader } from "@/components/user/AccountHeader";

// Type matches the tab metadata configuration
interface TabItem {
  label: string;
  value: ProfileTabValue;
  icon: LucideIcon;
  businessOnly?: boolean;
}

interface ProfileSettingsMenuProps {
  visibleProfileTabItems: TabItem[];
  activeTab: ProfileTabValue;
  handleTabChange: (tab: ProfileTabValue) => void;
  renderTabBadge: (tab: ProfileTabValue) => React.ReactNode;
  onLogout: () => void;
  user: ProfileUser | null;
  isMobileMenuView: boolean;
  setIsMobileMenuView: (val: boolean) => void;
  activeTabLabel: string;
}

export function ProfileSettingsMenu({
  visibleProfileTabItems,
  activeTab,
  handleTabChange,
  renderTabBadge,
  onLogout,
  user,
  isMobileMenuView,
  setIsMobileMenuView,
  activeTabLabel,
}: ProfileSettingsMenuProps) {
  return (
    <>
      {/* MOBILE STICKY HEADER — sits below the 100px MobileHeader */}
      <div className="sticky top-[100px] z-30 bg-gray-50/95 backdrop-blur-md border-b border-gray-100 py-2.5 -mx-4 px-4 mb-3 md:hidden transition-all shadow-sm">
        {isMobileMenuView ? (
          <div className="flex items-center gap-2">
            <AccountHeader mobile className="w-full" />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuView(true)}
              className="h-11 w-11 rounded-full hover:bg-gray-200 -ml-1"
            >
              <ChevronRight className="h-5 w-5 rotate-180 text-foreground-secondary" />
            </Button>
            <h1 className="text-lg font-bold text-foreground">
              {activeTabLabel}
            </h1>
          </div>
        )}
      </div>

      {/* LEFT SIDEBAR (Desktop Only) */}
      <aside className="hidden md:block space-y-1">
        <Card className="p-2 border-0 shadow-sm bg-white/80 backdrop-blur">
          {visibleProfileTabItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => handleTabChange(item.value)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all duration-200 font-medium group text-sm
                  ${isActive ? "bg-blue-50 text-link-dark shadow-sm shadow-blue-100 ring-1 ring-blue-200" : "text-foreground-tertiary hover:bg-slate-50 hover:text-foreground"}`}
              >
                <Icon className={`h-4.5 w-4.5 flex-shrink-0 transition-colors ${isActive ? "text-link" : "text-foreground-subtle group-hover:text-foreground-tertiary"}`} />
                <span>{item.label}</span>
                {renderTabBadge(item.value)}
                {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
              </button>
            );
          })}
          <Separator className="my-2" />
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-colors hover:bg-red-50 text-red-600 font-medium text-sm"
          >
            <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </Card>

        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Crown className="w-16 h-16" />
          </div>
          <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider mb-1">Current Plan</p>
          <p className="text-lg font-bold flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-400 fill-amber-400" />
            {user?.plan || "Free"}
          </p>
          {(!user?.plan || user.plan === "Free") && (
            <Button
              onClick={() => handleTabChange("plans")}
              size="sm"
              className="w-full mt-3 bg-white/10 hover:bg-white/20 border-0 text-white text-xs h-9"
            >
              Upgrade
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}

interface MobileMenuProps {
  visibleProfileTabItems: TabItem[];
  handleMobileTabClick: (tab: ProfileTabValue) => void;
  renderTabBadge: (tab: ProfileTabValue) => React.ReactNode;
  onLogout: () => void;
  user: ProfileUser | null;
}

export function ProfileSettingsMobileMenu({
  visibleProfileTabItems,
  handleMobileTabClick,
  renderTabBadge,
  onLogout,
  user,
}: MobileMenuProps) {
  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <Crown className="w-20 h-20" />
        </div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <p className="text-xs text-blue-100 font-medium mb-1">Your Plan</p>
            <p className="text-xl font-bold flex items-center gap-2">
              {user?.plan || "Free"}{" "}
              <Crown className="h-4 w-4 text-amber-300 fill-amber-300" />
            </p>
          </div>
          {(!user?.plan || user.plan === "Free") && (
            <Button
              onClick={() => handleMobileTabClick("plans")}
              size="sm"
              className="bg-white text-link-dark hover:bg-blue-50 text-xs font-bold px-4 h-10 rounded-full"
            >
              Upgrade
            </Button>
          )}
        </div>
      </div>
      <Card className="p-2 border-0 shadow-sm">
        {visibleProfileTabItems.map((item) => (
          <button
            key={item.value}
            onClick={() => handleMobileTabClick(item.value)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-colors active:bg-gray-100 text-foreground-secondary border-b border-gray-50 last:border-0"
          >
            <div className="p-1.5 bg-gray-100 rounded-lg text-muted-foreground">
              <item.icon className="h-4.5 w-4.5" />
            </div>
            <span className="text-sm font-semibold flex-1">{item.label}</span>
            {renderTabBadge(item.value)}
            <ChevronRight className="h-4 w-4 text-foreground-subtle" />
          </button>
        ))}
        <Separator className="my-1" />
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left active:bg-red-50 text-red-600"
        >
          <div className="p-2 bg-red-50 rounded-lg">
            <LogOut className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold">Logout</span>
        </button>
      </Card>
    </div>
  );
}
