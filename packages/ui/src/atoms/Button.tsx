"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../utils";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 relative before:absolute before:inset-y-[-4px] before:inset-x-0 before:content-[''] before:pointer-events-auto";

const variants = {
  default: "bg-primary text-primary-foreground font-semibold hover:bg-primary/90",
  primary: "bg-primary text-primary-foreground font-semibold hover:bg-primary/90",
  secondary: "bg-muted text-foreground font-medium hover:bg-muted/80",
  outline: "border border-border bg-background font-medium hover:bg-muted",
  ghost: "hover:bg-muted font-medium",
  destructive: "bg-destructive text-destructive-foreground font-semibold hover:bg-destructive/90",
  link: "text-primary font-medium underline-offset-4 hover:underline",
};

const sizes = {
  default: "h-11 px-5",
  sm: "h-9 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "size-11",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const buttonVariants = ({
  variant = "primary",
  size = "default",
  className,
}: {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
} = {}) => {
  return cn(
    base,
    variants[variant] || variants.default,
    sizes[size] || sizes.default,
    className
  );
};

export function Button({
  asChild,
  variant = "primary",
  size = "default",
  className,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(base, variants[variant] || variants.default, sizes[size] || sizes.default, className)}
      {...props}
    />
  );
}
