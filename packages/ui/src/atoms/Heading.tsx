import * as React from "react";
import { cn } from "../utils";

export type HeadingVariant = "display" | "h1" | "h2" | "h3" | "h4";

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** HTML Tag to render (h1, h2, h3, h4, h5, h6, span, div). Defaults to variant or 'h2'. */
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span" | "div";
  /** Semantic typography variant mapping to design tokens. */
  variant?: HeadingVariant;
}

const variantStyles: Record<HeadingVariant, string> = {
  display: "text-display font-bold tracking-tight leading-tight text-slate-900",
  h1: "text-h1 font-bold tracking-tight leading-snug text-slate-900",
  h2: "text-h2 font-bold tracking-tight leading-snug text-slate-900",
  h3: "text-h3 font-semibold tracking-tight leading-snug text-slate-900",
  h4: "text-h4 font-semibold tracking-normal leading-normal text-slate-800",
};

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ as, variant = "h2", className, children, ...props }, ref) => {
    const Component = as ?? (variant === "display" ? "h1" : variant);

    return (
      <Component
        ref={ref as any}
        className={cn(variantStyles[variant], className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Heading.displayName = "Heading";
