import { cn } from "../utils";
import type { NavigationItem, BottomNavigationProps } from "./NavigationModel";
import { BottomNavigationItem } from "./BottomNavigationItem";

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

  const renderItem = (item: NavigationItem) => (
    <BottomNavigationItem
      key={item.id}
      item={item}
      active={isItemActive ? isItemActive(item, currentPath) : currentPath === item.href}
      onSelectItem={onSelectItem}
      LinkComponent={LinkComponent}
    />
  );

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
