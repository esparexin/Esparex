import * as React from "react";
import { cn } from "../utils";

export type HeadingVariant = "display" | "h1" | "h2" | "h3" | "h4";
export type HeadingTone =
  | "default"
  | "secondary"
  | "muted"
  | "primary"
  | "destructive";

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  /** HTML Tag to render (h1, h2, h3, h4, h5, h6, span, div). Defaults to variant or 'h2'. */
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span" | "div";
  /** Semantic typography variant mapping to design tokens. */
  variant?: HeadingVariant;
  /** Semantic color tone mapping to design system tokens. */
  tone?: HeadingTone;
}

const variantStyles: Record<HeadingVariant, string> = {
  display: "text-display font-bold tracking-tight leading-tight",
  h1: "text-h1 font-bold tracking-tight leading-snug",
  h2: "text-h2 font-bold tracking-tight leading-snug",
  h3: "text-h3 font-semibold tracking-tight leading-snug",
  h4: "text-h4 font-semibold tracking-normal leading-normal",
};

const toneStyles: Record<HeadingTone, string> = {
  default: "text-foreground",
  secondary: "text-foreground-secondary",
  muted: "text-muted-foreground",
  primary: "text-primary",
  destructive: "text-destructive",
};

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  (
    {
      as,
      variant = "h2",
      tone = "default",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const Component = as ?? (variant === "display" ? "h1" : variant);

    return React.createElement(
      Component,
      {
        ref,
        className: cn(variantStyles[variant], toneStyles[tone], className),
        ...props,
      },
      children
    );
  }
);

Heading.displayName = "Heading";
