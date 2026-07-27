import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "@/components/ui/icons";
import type { ProfileTabValue } from "@/config/navigation";

export interface AccountNavItem {
  value: ProfileTabValue;
  label: string;
  icon: LucideIcon;
}

interface AccountNavItemListProps {
  /** Items to render — caller controls the set (filtered or full list) */
  items: AccountNavItem[];
  activeTab: ProfileTabValue;
  onTabChange: (tab: ProfileTabValue) => void;
  /** Render an optional badge node next to the label */
  renderTabBadge?: (tab: ProfileTabValue) => React.ReactNode;
  /** Visual variant: sidebar uses compact styling, menu uses full-row styling */
  variant?: "sidebar" | "menu";
}

/**
 * AccountNavItemList — shared canonical nav item renderer.
 *
 * Consumed by:
 *  - ProfileSettingsSidebar <aside> (desktop sidebar, variant="sidebar")
 *  - MoreMenuTab (mobile full-menu, variant="menu")
 *
 * Each consumer passes its own filtered/full item list and layout wrapper.
 */
export function AccountNavItemList({
  items,
  activeTab,
  onTabChange,
  renderTabBadge,
  variant = "sidebar",
}: AccountNavItemListProps) {
  const isSidebar = variant === "sidebar";

  return (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.value;

        if (isSidebar) {
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onTabChange(item.value)}
              aria-current={isActive ? "page" : undefined}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 font-medium group text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                ${isActive
                  ? "bg-blue-50 text-link-dark shadow-sm shadow-blue-100 ring-1 ring-blue-200"
                  : "text-foreground-tertiary hover:bg-slate-50 hover:text-foreground"
                }`}
            >
              <Icon
                className={`h-4 w-4 flex-shrink-0 transition-colors ${
                  isActive
                    ? "text-link"
                    : "text-foreground-subtle group-hover:text-foreground-tertiary"
                }`}
              />
              <span>{item.label}</span>
              {renderTabBadge?.(item.value)}
              {isActive && <ChevronRight className="h-4 w-4 opacity-50 ml-auto" />}
            </button>
          );
        }

        // menu variant (MoreMenuTab)
        return (
          <button
            key={item.value}
            type="button"
            role="listitem"
            onClick={() => onTabChange(item.value)}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left font-medium text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
          >
            <Icon className="h-5 w-5 text-slate-500 flex-shrink-0" />
            <span className="flex-1 text-slate-700 font-normal text-xs sm:text-sm">{item.label}</span>
            {renderTabBadge?.(item.value)}
            <ChevronRight className="h-4 w-4 text-slate-400 ml-auto" />
          </button>
        );
      })}
    </>
  );
}
