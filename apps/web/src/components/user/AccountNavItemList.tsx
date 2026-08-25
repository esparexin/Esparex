import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "@/icons/IconRegistry";
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
  /** Visual variant: sidebar for desktop sidebar, menu for mobile full menu */
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
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 font-medium group text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                ${isActive
                  ? "bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20"
                  : "text-foreground-tertiary hover:bg-muted/60 hover:text-foreground"
                }`}
            >
              <Icon
                className={`h-4 w-4 flex-shrink-0 transition-colors ${
                  isActive
                    ? "text-primary"
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
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left font-medium text-body text-foreground-secondary hover:bg-muted/60 active:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
          >
            <Icon className="h-5 w-5 text-foreground-subtle flex-shrink-0" />
            <span className="flex-1 text-foreground-secondary font-normal text-caption sm:text-body">{item.label}</span>
            {renderTabBadge?.(item.value)}
            <ChevronRight className="h-4 w-4 text-foreground-subtle ml-auto" />
          </button>
        );
      })}
    </>
  );
}
