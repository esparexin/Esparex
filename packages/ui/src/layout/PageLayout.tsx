import * as React from "react";
import { cn } from "../utils";

export type PageLayoutVariant = "default" | "dashboard" | "listing" | "auth" | "fullscreen" | "admin";

export interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: PageLayoutVariant;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  bottomNavigation?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  children: React.ReactNode;
}

export const PageLayout = React.forwardRef<HTMLDivElement, PageLayoutProps>(
  (
    {
      className,
      variant = "default",
      header,
      sidebar,
      bottomNavigation,
      breadcrumbs,
      children,
      ...props
    },
    ref
  ) => {
    const isFullscreen = variant === "fullscreen";
    const isAdmin = variant === "admin";
    const hasSidebar = Boolean(sidebar);

    if (isFullscreen) {
      return (
        <div ref={ref} className={cn("flex h-dvh flex-col overflow-hidden bg-background", className)} {...props}>
          {header}
          <main className="flex-1 min-h-0 overflow-y-auto focus:outline-none">
            {children}
          </main>
          {bottomNavigation}
        </div>
      );
    }

    return (
      <div ref={ref} className={cn("flex min-h-screen flex-col bg-background", className)} {...props}>
        {header}
        
        <div className={cn("flex flex-1", header && "pt-[96px] md:pt-16")}>
          {hasSidebar && (
            <aside className={cn("shrink-0 border-r border-border", isAdmin ? "" : "hidden w-64 md:block")}>
              {sidebar}
            </aside>
          )}
          
          <main className="flex flex-1 flex-col focus:outline-none min-w-0">
             {breadcrumbs && (
                <div className="px-4 sm:px-6 md:px-8 pt-4 pb-2">
                   {breadcrumbs}
                </div>
             )}
             
             {children}
             
             {/* Bottom padding for mobile navigation safe area */}
             {bottomNavigation && (
                 <div className="md:hidden pb-[calc(3.5rem+env(safe-area-inset-bottom))]" />
             )}
          </main>
        </div>
        
        {bottomNavigation && (
           <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
             {bottomNavigation}
           </div>
        )}
      </div>
    );
  }
);
PageLayout.displayName = "PageLayout";
