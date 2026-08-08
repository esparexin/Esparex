import * as React from "react";
import { cn } from "../utils";
import type { NavigationTree } from "./NavigationModel";

export interface BottomNavigationProps {
  /** The canonical navigation data model */
  navigation?: NavigationTree;
  /** Custom Link component (e.g. next/link) */
  LinkComponent?: React.ElementType;
  /** Currently active pathname to match against item hrefs */
  currentPath?: string;
  className?: string;
}

export function BottomNavigation({
  navigation,
  LinkComponent = "a",
  currentPath,
  className,
}: BottomNavigationProps) {
  const items = navigation?.primary || [];
  
  if (items.length === 0) return null;

  // Bottom navigation typically supports 3-5 items
  const displayItems = items.slice(0, 5);

  return (
    <nav 
      aria-label="Mobile Bottom Navigation" 
      className={cn(
        "flex h-16 items-center justify-around border-t border-border bg-background pb-[env(safe-area-inset-bottom)]", 
        className
      )}
    >
      {displayItems.map((item) => {
        const isActive = currentPath === item.href;
        const Icon = item.icon;
        return (
          <LinkComponent
            key={item.id}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center min-w-[48px] min-h-[48px] gap-1 px-2 py-1 transition-colors",
              isActive ? "text-primary" : "text-foreground-secondary hover:text-foreground",
              item.disabled && "pointer-events-none opacity-50"
            )}
            aria-current={isActive ? "page" : undefined}
            aria-disabled={item.disabled}
          >
            {Icon && <Icon className="h-5 w-5 shrink-0" />}
            <span className="text-[10px] font-medium leading-none truncate w-full text-center">
              {item.label}
            </span>
          </LinkComponent>
        );
      })}
    </nav>
  );
}
