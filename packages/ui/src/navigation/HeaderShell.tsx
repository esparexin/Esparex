import * as React from "react";
import { cn } from "../utils";
import type { NavigationTree, NavigationItem } from "./NavigationModel";

interface HeaderShellProps {
  logo?: React.ReactNode;
  /** The canonical navigation data model */
  navigation?: NavigationTree;
  /** Custom Link component (e.g. next/link) */
  LinkComponent?: React.ElementType;
  /** Currently active pathname to match against item hrefs */
  currentPath?: string;
  
  /** Action area (user menu, search, etc) */
  actions?: React.ReactNode;
  /** Mobile navigation trigger (e.g. hamburger button) */
  mobileNavigation?: React.ReactNode;
  className?: string;
  isCompact?: boolean;
}

export function HeaderShell({
  logo,
  navigation,
  LinkComponent = "a",
  currentPath,
  actions,
  mobileNavigation,
  className,
  isCompact = false,
}: HeaderShellProps) {
  const renderDesktopNav = (items?: NavigationItem[]) => {
    if (!items || items.length === 0) return null;
    return (
      <nav aria-label="Primary Navigation" className="flex items-center gap-6">
        {items.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <LinkComponent
              key={item.id}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive ? "text-foreground" : "text-foreground-secondary",
                item.disabled && "pointer-events-none opacity-50"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {item.label}
            </LinkComponent>
          );
        })}
      </nav>
    );
  };

  return (
    <header className={cn("sticky top-0 z-30 shrink-0 border-b border-border bg-background/90 backdrop-blur w-full", className)}>
      {/* Desktop Layout */}
      <div className={cn("hidden lg:flex items-center justify-between px-4 lg:px-8", isCompact ? "h-14" : "h-16")}>
        <div className="flex items-center gap-6">
          {logo && <div className="shrink-0">{logo}</div>}
          {navigation?.primary && <div className="hidden lg:block ml-4">{renderDesktopNav(navigation.primary)}</div>}
        </div>
        {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
      </div>

      {/* Mobile Layout */}
      <div className="flex lg:hidden flex-col">
        <div className={cn("flex items-center justify-between px-4", isCompact ? "h-12" : "h-14")}>
          <div className="flex items-center gap-4 min-w-0">
            {mobileNavigation}
            {logo && <div className="shrink-0">{logo}</div>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>
    </header>
  );
}
