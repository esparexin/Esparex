import * as React from "react";
import { cn } from "../utils";
import type { NavigationItem } from "./NavigationModel";

export interface BottomNavigationItemProps {
  item: NavigationItem;
  active: boolean;
  onSelectItem?: (item: NavigationItem) => void;
  LinkComponent?: React.ElementType;
}

/**
 * Renders a single bottom-navigation item — as a `<button>` invoking
 * `onSelectItem` when provided, otherwise as the `LinkComponent` —
 * with icon, label, and optional badge.
 */
export function BottomNavigationItem({
  item,
  active,
  onSelectItem,
  LinkComponent = "a",
}: BottomNavigationItemProps) {
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
      href={item.href}
      className={itemClassName}
      aria-current={active ? "page" : undefined}
      aria-disabled={item.disabled}
    >
      {content}
    </LinkComponent>
  );
}
