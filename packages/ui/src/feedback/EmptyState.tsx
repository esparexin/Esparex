import * as React from "react";
import type { LucideIcon } from "../atoms/icons";
import { cn } from "../utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "simple";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "default",
  className,
  ...props
}: EmptyStateProps) {
  const isSimple = variant === "simple";

  return (
    <div
      role="region"
      aria-label={title}
      className={cn(
        isSimple
          ? "flex w-full flex-col items-center justify-center py-10 sm:py-14 px-4 text-center animate-in fade-in duration-200"
          : "flex min-h-[280px] w-full flex-col items-center justify-center rounded-2xl border border-border/60 bg-muted/30 p-8 text-center animate-in fade-in duration-200",
        className
      )}
      {...props}
    >
      {Icon && (
        <div
          className={cn(
            isSimple
              ? "mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground"
              : "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs"
          )}
        >
          <Icon className={isSimple ? "h-5 w-5" : "h-7 w-7"} />
        </div>
      )}
      <h3
        className={cn(
          isSimple
            ? "text-body-lg sm:text-h4 font-semibold text-foreground tracking-tight"
            : "text-body-lg font-bold text-foreground md:text-h4"
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            isSimple
              ? "mt-1 max-w-sm text-caption sm:text-small text-muted-foreground leading-normal"
              : "mt-1.5 max-w-sm text-caption text-muted-foreground leading-relaxed"
          )}
        >
          {description}
        </p>
      )}
      {action && (
        <div className={cn(isSimple ? "mt-4 flex flex-wrap items-center justify-center gap-2.5" : "mt-5 flex flex-wrap items-center justify-center gap-3")}>
          {action}
        </div>
      )}
    </div>
  );
}
