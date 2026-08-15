import * as React from "react";
import { cn } from "../utils";

export type TextVariant = "body-lg" | "body" | "small" | "caption" | "tiny";
export type TextTone =
  | "default"
  | "secondary"
  | "tertiary"
  | "muted"
  | "subtle"
  | "primary"
  | "destructive"
  | "success"
  | "warning";

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  /** HTML Tag to render (p, span, div, label, etc.). Defaults to 'p'. */
  as?: "p" | "span" | "div" | "label" | "small" | "strong" | "em";
  /** Semantic typography variant mapping to design tokens. */
  variant?: TextVariant;
  /** Semantic color tone mapping to design system tokens. */
  tone?: TextTone;
}

const variantStyles: Record<TextVariant, string> = {
  "body-lg": "text-body-lg font-normal tracking-normal leading-relaxed",
  body: "text-body font-normal tracking-normal leading-relaxed",
  small: "text-small font-normal tracking-normal leading-normal",
  caption: "text-caption font-normal tracking-normal leading-normal",
  tiny: "text-tiny font-normal tracking-normal leading-normal",
};

const toneStyles: Record<TextTone, string> = {
  default: "text-foreground",
  secondary: "text-foreground-secondary",
  tertiary: "text-foreground-tertiary",
  muted: "text-muted-foreground",
  subtle: "text-foreground-subtle",
  primary: "text-primary",
  destructive: "text-destructive",
  success: "text-success",
  warning: "text-warning",
};

export const Text = React.forwardRef<HTMLElement, TextProps>(
  (
    {
      as: Component = "p",
      variant = "body",
      tone = "default",
      className,
      children,
      ...props
    },
    ref
  ) => {
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

Text.displayName = "Text";
