import * as React from "react";

export type NavigationItem = {
  id: string;
  label: string;
  href: string;
  icon?: React.ElementType;
  disabled?: boolean;
  children?: NavigationItem[];
};

export type NavigationTree = {
  primary: NavigationItem[];
  secondary?: NavigationItem[];
  context?: NavigationItem[];
  user?: NavigationItem[];
};
