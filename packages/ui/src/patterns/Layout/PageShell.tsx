import * as React from "react";
import { cn } from "../../utils";

export interface PageShellProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  headerVariant?: "default" | "compact";
  headerActions?: React.ReactNode;
  search?: React.ReactNode;
  tabs?: React.ReactNode;
  filters?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  isNested?: boolean;
}

export function PageShell({
  title,
  description,
  headerVariant = "default",
  headerActions,
  search,
  tabs,
  filters,
  children,
  className,
  isNested = false,
}: PageShellProps) {
  const isCompact = headerVariant === "compact";

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <header className="shrink-0 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            {isNested ? (
              <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
            ) : (
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            )}
            {!isCompact && description && (
              <div className={cn("mt-1 text-sm text-slate-500", isNested && "text-slate-400")}>
                {description}
              </div>
            )}
          </div>
          {!isCompact && !isNested && search && (
            <div className="hidden flex-1 md:block max-w-xl mx-4">
              {search}
            </div>
          )}
          {headerActions ? <div className="flex shrink-0 items-center gap-2">{headerActions}</div> : null}
        </div>
        {tabs}
        {filters}
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
