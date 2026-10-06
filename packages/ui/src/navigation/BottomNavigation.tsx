import * as React from "react";
import { cn } from "../utils";
import type { NavigationTree, NavigationItem } from "./NavigationModel";

export interface BottomNavigationProps {
  /** The canonical navigation data model */
  navigation?: NavigationTree;
  /** Custom Link component (e.g. next/link) */
  LinkComponent?: React.ElementType;
  /** Currently active pathname to match against item hrefs */
  currentPath?: string;
  className?: string;
  /** Accessible label for the nav landmark */
  ariaLabel?: string;
  /**
   * When provided, items render as `<button>`s invoking this callback instead
   * of links (e.g. tab bars driven by local state rather than routes).
   */
  onSelectItem?: (item: NavigationItem) => void;
  /** Custom active-state matcher (default: exact href match) */
  isItemActive?: (item: NavigationItem, currentPath?: string) => boolean;
  /**
   * Node rendered in the visual center slot, with items split around it
   * (e.g. a primary "Post Ad" action). Omit for a plain item row.
   */
  centerAction?: React.ReactNode;
}

export function BottomNavigation({
  navigation,
  LinkComponent = "a",
  currentPath,
  className,
  ariaLabel = "Mobile Bottom Navigation",
  onSelectItem,
  isItemActive,
  centerAction,
}: BottomNavigationProps) {
  const items = navigation?.primary || [];

  if (items.length === 0 && !centerAction) return null;

  const isActive = (item: NavigationItem) =>
    isItemActive ? isItemActive(item, currentPath) : currentPath === item.href;

  const renderItem = (item: NavigationItem) => {
    const active = isActive(item);
    const Icon = item.icon;
    const content = (
      <>
        <span className="relative flex items-center justify-center">
          {Icon && <Icon className="h-5 w-5 shrink-0" />}
          {item.badge != null && item.badge !== "" && (
            <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-tiny font-bold text-destructive-foreground">
              {item.badge}
            </span>
          )}
        </span>
        <span className="text-tiny font-medium leading-none truncate w-full text-center">
          {item.label}
        </span>
      </>
    );
    const itemClassName = cn(
      "flex flex-col items-center justify-center min-w-[48px] min-h-[48px] gap-1 px-2 py-1 transition-colors",
      active ? "text-primary" : "text-foreground-secondary hover:text-primary",
      item.disabled && "pointer-events-none opacity-50"
    );

    if (onSelectItem) {
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelectItem(item)}
          className={itemClassName}
          aria-current={active ? "page" : undefined}
          aria-disabled={item.disabled}
        >
          {content}
        </button>
      );
    }

    return (
      <LinkComponent
        key={item.id}
        href={item.href}
        className={itemClassName}
        aria-current={active ? "page" : undefined}
        aria-disabled={item.disabled}
      >
        {content}
      </LinkComponent>
    );
  };

  // Split items around the center action (left half | action | right half);
  // without a center action the row renders as a single group, as before.
  const half = Math.ceil(items.length / 2);
  const leftItems = centerAction ? items.slice(0, half) : items;
  const rightItems = centerAction ? items.slice(half) : [];

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "flex h-16 items-center justify-around border-t border-border bg-background pb-[env(safe-area-inset-bottom)]",
        className
      )}
    >
      {leftItems.map(renderItem)}
      {centerAction}
      {rightItems.map(renderItem)}
    </nav>
  );
}
