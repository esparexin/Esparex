import * as React from "react";
import { cn } from "../utils";

export interface CardProps extends React.ComponentProps<"div"> {
  /** Elevation level matching EFAS surface architecture (0: flat, 1: default surface, 2: interactive/hover, 3: floating overlay, 4: modal) */
  elevation?: 0 | 1 | 2 | 3 | 4;
  /** Visual variant (default: opaque marketplace surface; soft: subtle background; glass: translucent; outlined: border-only) */
  variant?: "default" | "soft" | "glass" | "outlined";
}

const elevationVariants: Record<NonNullable<CardProps["elevation"]>, string> = {
  0: "shadow-none border-transparent",
  1: "shadow-2xs",
  2: "shadow-xs hover:shadow-sm hover:-translate-y-0.5",
  3: "shadow-md",
  4: "shadow-xl",
};

const surfaceVariants: Record<NonNullable<CardProps["variant"]>, string> = {
  default: "bg-card text-card-foreground border-border hover:border-border",
  soft: "bg-muted/40 text-foreground border-border/40",
  glass: "bg-card/80 backdrop-blur-md border-border/30 text-foreground",
  outlined: "bg-transparent border-border text-foreground",
};

function Card({
  className,
  elevation = 1,
  variant = "default",
  ...props
}: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col gap-2.5 rounded-xl border transition-all duration-200",
        surfaceVariants[variant],
        elevationVariants[elevation],
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-3 pt-3 sm:px-3.5 sm:pt-3.5 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-2 sm:[.border-b]:pb-2.5",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <h4
      data-slot="card-title"
      className={cn("leading-snug font-semibold text-h4 text-foreground tracking-tight", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-muted-foreground text-caption font-normal", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-3 sm:px-3.5 [&:last-child]:pb-3 sm:[&:last-child]:pb-3.5", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
};

