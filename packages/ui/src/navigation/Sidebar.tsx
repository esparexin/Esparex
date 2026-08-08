import * as React from "react";
import { cn } from "../utils";
import type { NavigationTree, NavigationItem } from "./NavigationModel";

export interface SidebarProps {
  /** If the sidebar is collapsed/minified (desktop only) */
  isCollapsed?: boolean;
  /** If the mobile drawer is open */
  isMobileOpen?: boolean;
  /** Callback for mobile overlay click or close button */
  onMobileClose?: () => void;
  
  /** The canonical navigation data model */
  navigation?: NavigationTree;
  /** Custom Link component (e.g. next/link) */
  LinkComponent?: React.ElementType;
  /** Currently active pathname to match against item hrefs */
  currentPath?: string;
  
  /** Brand/Logo area at top */
  header?: React.ReactNode;
  /** Footer meta area */
  footer?: React.ReactNode;
  /** Optional children for custom content below navigation */
  children?: React.ReactNode;
}

export function Sidebar({
  isCollapsed = false,
  isMobileOpen = false,
  onMobileClose,
  navigation,
  LinkComponent = "a",
  currentPath,
  header,
  footer,
  children,
}: SidebarProps) {
  const renderNavGroup = (items?: NavigationItem[]) => {
    if (!items || items.length === 0) return null;
    
    return (
      <ul className="flex flex-col gap-1 px-2 py-4">
        {items.map((item) => {
          const isActive = currentPath === item.href;
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <LinkComponent
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-[44px]",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-sidebar-foreground hover:bg-slate-800",
                  item.disabled && "pointer-events-none opacity-50",
                  isCollapsed && "justify-center px-0"
                )}
                aria-current={isActive ? "page" : undefined}
                aria-disabled={item.disabled}
                onClick={onMobileClose}
              >
                {Icon && <Icon className="h-5 w-5 shrink-0" />}
                {!isCollapsed && <span>{item.label}</span>}
              </LinkComponent>
            </li>
          );
        })}
      </ul>
    );
  };

  const navContent = (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar" aria-label="Sidebar Navigation">
      {navigation?.primary && renderNavGroup(navigation.primary)}
      {navigation?.secondary && (
        <>
          <div className="my-2 h-px bg-slate-800 mx-4" role="separator" />
          {renderNavGroup(navigation.secondary)}
        </>
      )}
      {navigation?.context && (
        <>
          <div className="my-2 h-px bg-slate-800 mx-4" role="separator" />
          {renderNavGroup(navigation.context)}
        </>
      )}
      {children}
    </nav>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Sidebar (Drawer) */}
      <aside
        aria-hidden={!isMobileOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[var(--sidebar-expanded,260px)] flex-col border-r border-slate-800 bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {header && (
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 px-4">
            {header}
          </div>
        )}
        {navContent}
        {footer && (
          <div className="border-t border-slate-800 px-4 py-3">
            {footer}
          </div>
        )}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className="relative z-20 hidden h-full shrink-0 flex-col border-r border-slate-800 bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-in-out lg:flex"
        style={{ width: isCollapsed ? "var(--sidebar-collapsed,64px)" : "var(--sidebar-expanded,260px)" }}
      >
        {header && (
          <div className={cn("flex h-14 shrink-0 items-center border-b border-slate-800 px-4", isCollapsed ? "justify-center" : "justify-between")}>
            {header}
          </div>
        )}
        {navContent}
        {footer && (
          <div className={cn("border-t border-slate-800 px-4 py-3", isCollapsed ? "text-center" : "")}>
            {footer}
          </div>
        )}
      </aside>
    </>
  );
}
