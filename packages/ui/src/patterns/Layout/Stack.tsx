import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../utils";

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  direction?: "row" | "col" | "row-reverse" | "col-reverse";
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: "nowrap" | "wrap" | "wrap-reverse";
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
}

const directionClasses = {
  row: "flex-row",
  col: "flex-col",
  "row-reverse": "flex-row-reverse",
  "col-reverse": "flex-col-reverse",
};

const alignClasses = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

const justifyClasses = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

const wrapClasses = {
  nowrap: "flex-nowrap",
  wrap: "flex-wrap",
  "wrap-reverse": "flex-wrap-reverse",
};

const gapClasses = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
  "2xl": "gap-12",
};

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  (
    {
      className,
      direction = "col",
      align = "stretch",
      justify = "start",
      wrap = "nowrap",
      gap = "md",
      asChild,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        ref={ref}
        className={cn(
          "flex",
          directionClasses[direction],
          alignClasses[align],
          justifyClasses[justify],
          wrapClasses[wrap],
          gapClasses[gap],
          className
        )}
        {...props}
      />
    );
  }
);
Stack.displayName = "Stack";
