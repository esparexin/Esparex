"use client";

import type { User } from "@/types/User";
import { PROFILE_TAB_ITEMS, type ProfileTabValue } from "@/config/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@esparex/ui";
import { Crown, ChevronRight, LogOut } from "@/components/ui/icons";

interface MoreMenuTabProps {
  user: (User & { plan?: string }) | null;
  onTabChange: (tab: ProfileTabValue) => void;
  onLogout: () => void | Promise<void>;
  renderTabBadge: (tab: ProfileTabValue) => React.ReactNode;
}

export function MoreMenuTab({
  user,
  onTabChange,
  onLogout,
  renderTabBadge,
}: MoreMenuTabProps) {
  return (
    <div className="space-y-4 block md:hidden max-w-full pb-20">
      {/* Current Plan Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-10">
          <Crown className="w-16 h-16" />
        </div>
        <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider mb-1">
          Current Plan
        </p>
        <p className="text-base font-bold flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-400 fill-amber-400" />
          {user?.plan || "Free"}
        </p>
        {(!user?.plan || user.plan === "Free") && (
          <Button
            type="button"
            onClick={() => onTabChange("plans")}
            size="sm"
            className="w-full mt-3 bg-white/15 hover:bg-white/25 border-0 text-white text-xs h-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
          >
            Upgrade Plan
          </Button>
        )}
      </div>

      {/* Navigation List */}
      <Card className="p-2 border-0 shadow-sm bg-white">
        <div className="space-y-1">
          {PROFILE_TAB_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onTabChange(item.value)}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left font-medium text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
              >
                <Icon className="h-5 w-5 text-slate-500 flex-shrink-0" />
                <span className="flex-1 text-slate-900 font-semibold">{item.label}</span>
                {renderTabBadge(item.value)}
                <ChevronRight className="h-4 w-4 text-slate-400 ml-auto" />
              </button>
            );
          })}
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
