import * as React from "react";

export type NavigationItem = {
  id: string;
  label: string;
  href: string;
  icon?: React.ElementType;
  disabled?: boolean;
  /** Badge rendered on the item (e.g. unread count, pre-formatted by the caller) */
  badge?: number | string;
  children?: NavigationItem[];
};

export type NavigationTree = {
  primary: NavigationItem[];
  secondary?: NavigationItem[];
  context?: NavigationItem[];
  user?: NavigationItem[];
};

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
