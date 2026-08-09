import * as React from "react";
import { cn } from "../utils";

export type TextVariant = "body" | "small" | "caption";

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  /** HTML Tag to render (p, span, div, label). Defaults to 'p'. */
  as?: "p" | "span" | "div" | "label";
  /** Semantic typography variant mapping to design tokens. */
  variant?: TextVariant;
}

const variantStyles: Record<TextVariant, string> = {
  body: "text-body font-normal tracking-normal leading-relaxed text-slate-800",
  small: "text-small font-normal tracking-normal leading-normal text-slate-600",
  caption: "text-caption font-medium tracking-normal leading-normal text-slate-500",
};

export const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ as: Component = "p", variant = "body", className, children, ...props }, ref) => {
    return React.createElement(
      Component,
      {
        ref,
        className: cn(variantStyles[variant], className),
        ...props,
      },
      children
    );
  }
);

Text.displayName = "Text";
