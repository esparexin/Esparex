import type { LucideIcon } from "@esparex/ui";
import { ChevronRight, LogOut, Separator } from "@esparex/ui";
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
  /** Optional consolidated logout action */
  onLogout?: () => void | Promise<void>;
}

/**
 * AccountNavItemList — shared canonical nav item renderer.
 *
 * Consumed by:
 *  - ProfileSettingsSidebar <aside> (desktop sidebar, variant="sidebar")
 *  - MoreMenuTab (mobile full-menu, variant="menu")
 *
 * Each consumer passes its own filtered/full item list and layout wrapper.
 *
 * ── CANONICAL TYPOGRAPHY ROLE → TOKEN MAP (SSOT) ──────────────
 * Page title (mobile h1):       text-body-lg     (16px)
 * Section / card heading:       text-body-lg     (16px) — h3/h4 card titles, dialog titles
 * Empty state heading:          text-body-lg     (16px) — "No items yet" headings
 * Tab button label:             text-body        (14px) — both pill tabs & underline tabs
 * Menu / nav item label:        text-body        (14px) — sidebar & mobile menu items
 * Setting row title:            text-body        (14px) — toggle row titles
 * Card list item title:         text-body        (14px) — transaction rows, alert cards
 * CTA button label:             text-body        (14px) — primary action buttons
 * Description / helper text:    text-caption     (12px) — subtitles, helper lines
 * Secondary action button:      text-caption     (12px) — outline/ghost small buttons
 * Error banner text:            text-caption     (12px) — inline error messages
 * Badge / status chip:          text-tiny        (11px) — status pills, counters
 * Metadata / timestamps:        text-tiny        (11px) — dates, footer metadata
 * Bottom nav labels:            text-tiny        (11px) — compact nav bar
 * ───────────────────────────────────────────────────────────────
 */
export function AccountNavItemList({
  items,
  activeTab,
  onTabChange,
  renderTabBadge,
  variant = "sidebar",
  onLogout,
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
            <span className="flex-1 text-foreground font-medium text-body">{item.label}</span>
            {renderTabBadge?.(item.value)}
            <ChevronRight className="h-4 w-4 text-foreground-subtle ml-auto" />
          </button>
        );
      })}

      {onLogout && isSidebar && (
        <>
          <Separator className="my-2" />
          <button
            type="button"
            onClick={() => { void onLogout(); }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors hover:bg-destructive/10 text-destructive font-medium text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
          >
            <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
            <span>Log out</span>
          </button>
        </>
      )}

      {onLogout && !isSidebar && (
        <div className="pt-1 mt-1 border-t border-border">
          <button
            type="button"
            onClick={() => { void onLogout(); }}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left font-medium text-body text-destructive hover:bg-destructive/10 active:bg-destructive/20 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>Log out</span>
          </button>
        </div>
      )}
    </>
  );
}
