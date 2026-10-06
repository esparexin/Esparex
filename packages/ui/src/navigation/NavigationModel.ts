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
