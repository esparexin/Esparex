import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../utils";

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: "none" | "sm" | "md" | "lg" | "xl";
  align?: "start" | "center" | "end" | "stretch";
}

const colsClasses = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  12: "grid-cols-4 sm:grid-cols-6 lg:grid-cols-12",
};

const gapClasses = {
  none: "gap-0",
  sm: "gap-2 sm:gap-4",
  md: "gap-4 sm:gap-6",
  lg: "gap-6 sm:gap-8",
  xl: "gap-8 sm:gap-12",
};

const alignClasses = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols = 1, gap = "md", align = "stretch", asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        ref={ref}
        className={cn(
          "grid",
          colsClasses[cols],
          gapClasses[gap],
          alignClasses[align],
          className
        )}
        {...props}
      />
    );
  }
);
Grid.displayName = "Grid";
