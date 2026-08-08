import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../utils";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  variant?: "sm" | "md" | "lg" | "xl" | "full";
}

const variants = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  xl: "max-w-screen-2xl",
  full: "max-w-full",
};

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, variant = "lg", asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        ref={ref}
        className={cn(
          "w-full mx-auto px-4 sm:px-6 md:px-8",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Container.displayName = "Container";
