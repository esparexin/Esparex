import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center justify-center rounded-[10px] text-base font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none";

const variants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90", // Backwards compatibility
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-muted text-foreground hover:bg-muted/80",
  outline: "border border-border bg-background hover:bg-muted",
  ghost: "hover:bg-muted",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  link: "text-primary underline-offset-4 hover:underline", // Added link for safety
};

const sizes = {
  default: "h-11 px-5",
  sm: "h-9 px-3 text-sm",
  lg: "h-12 px-8",
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
