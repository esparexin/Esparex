import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../utils";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
  spacing?: "none" | "sm" | "md" | "lg" | "xl";
}

const spacingVariants = {
  none: "",
  sm: "py-6 md:py-8",
  md: "py-12 md:py-16",
  lg: "py-16 md:py-24",
  xl: "py-24 md:py-32",
};

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, spacing = "md", asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "section";
    return (
      <Comp
        ref={ref}
        className={cn(
          "w-full",
          spacingVariants[spacing],
          className
        )}
        {...props}
      />
    );
  }
);
Section.displayName = "Section";
