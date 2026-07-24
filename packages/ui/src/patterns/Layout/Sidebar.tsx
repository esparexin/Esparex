import * as React from "react";
import { cn } from "../../utils";

export interface SidebarProps {
  /** If the sidebar is collapsed/minified (desktop only) */
  isCollapsed?: boolean;
  /** If the mobile drawer is open */
  isMobileOpen?: boolean;
  /** Callback for mobile overlay click or close button */
  onMobileClose?: () => void;
  
  /** Brand/Logo area at top */
  header?: React.ReactNode;
  /** Footer meta area */
  footer?: React.ReactNode;
  /** Content of the sidebar (typically navigation links) */
  children: React.ReactNode;
}

export function Sidebar({
  isCollapsed = false,
  isMobileOpen = false,
  onMobileClose,
  header,
  footer,
  children,
}: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Sidebar */}
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {children}
        </div>
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {children}
        </div>
        {footer && (
          <div className={cn("border-t border-slate-800 px-4 py-3", isCollapsed ? "text-center" : "")}>
            {footer}
          </div>
        )}
      </aside>
    </>
  );
}
