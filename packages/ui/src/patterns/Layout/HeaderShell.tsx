import * as React from "react";
import { cn } from "../../utils";

interface HeaderShellProps {
  logo?: React.ReactNode;
  navigation?: React.ReactNode;
  actions?: React.ReactNode;
  mobileNavigation?: React.ReactNode;
  className?: string;
  isCompact?: boolean;
}

export function HeaderShell({
  logo,
  navigation,
  actions,
  mobileNavigation,
  className,
  isCompact = false,
}: HeaderShellProps) {
  return (
    <header className={cn("sticky top-0 z-30 shrink-0 border-b border-slate-200/80 bg-white/90 backdrop-blur w-full", className)}>
      {/* Desktop Layout */}
      <div className={cn("hidden lg:flex items-center justify-between px-4 lg:px-8", isCompact ? "h-14" : "h-16")}>
        <div className="flex items-center gap-6">
          {logo && <div className="shrink-0">{logo}</div>}
          {navigation && <div className="hidden lg:block">{navigation}</div>}
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
