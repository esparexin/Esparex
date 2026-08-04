"use client";

import type { ProfileTabValue } from "@/config/navigation";
import { User, Package, MessageSquare, Bell, MoreHorizontal } from "@/components/ui/icons";

interface MobileAccountBottomNavProps {
  activeTab: ProfileTabValue;
  onTabChange: (tab: ProfileTabValue) => void;
  unreadCount?: number;
}

interface BottomNavItem {
  value: ProfileTabValue;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function MobileAccountBottomNav({
  activeTab,
  onTabChange,
  unreadCount = 0,
}: MobileAccountBottomNavProps) {
  const items: BottomNavItem[] = [
    { value: "personal", label: "Account", icon: User },
    { value: "mylistings", label: "Listings", icon: Package },
    { value: "messages", label: "Messages", icon: MessageSquare, badge: unreadCount },
    { value: "smartalerts", label: "Alerts", icon: Bell },
    { value: "more", label: "More", icon: MoreHorizontal },
  ];

  return (
    <nav
      aria-label="Mobile account navigation"
      className="fixed bottom-0 left-0 right-0 z-40 h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-white/95 backdrop-blur-md border-t border-slate-200 flex md:hidden items-center justify-around px-1"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onTabChange(item.value)}
            aria-current={isActive ? "page" : undefined}
            className={`flex-1 flex flex-col items-center justify-center min-h-[44px] py-1 transition-all rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isActive ? "text-blue-600 font-medium" : "text-slate-500 hover:text-slate-700 font-normal"
            }`}
          >
            <div className="relative">
              <Icon className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-slate-500"}`} />
              {!!item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-tiny font-bold text-white shadow-sm">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </div>
            <span className="text-tiny mt-0.5 tracking-tight truncate max-w-[64px]">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
